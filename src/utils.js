var $ = require( "jquery" );
import * as rpts from './printout.js';
function strtobuf(str){
  let buf = Buffer.alloc(0);
  buf = Buffer.alloc(1);
  buf.writeUInt8(parseInt(str,2));
  console.log("buf:",buf) 
  return buf
}

function sendCommand(port, addr, cmd){
  let msg = strtobuf((Number(addr) & 0b111).toString(2).padStart(3,'0') + cmd,"binary" )
  port.write(msg);
  console.log("sent command:",msg)
}

function decodeHandshakeResponse(data) {
  let str = ((data[0] >> 4) & 0b00001111).toString() + "." + (data[0] & 0b00001111).toString()  
  return str;
}

function decodeAdr(data) {
  let str = ''; // string to store decoded data
  for (let i = 1; i < data.length; i++) {
    str += String.fromCharCode(data[i]); // convert data to string
  }
  return str;
}

function parseData(caller,data){
  let i = 0;
  while (data.indexOf(i) === 0) {
    i++;
  }
  data = data.slice(i);
  let addr = ((data[0] & 0xE0) >> 5);
  let cmd = data[0] & 0x1F;
  console.log(data,addr,cmd);
  switch (cmd) {
    case 0b00000:
      // self test // 
      return parseSelfTest(data[1]);

    case 0b00001:
      //Serial number // 
      return parseSerialNumber(data,"parseFunc");

    case 0b00010:
      // data dump // 
      rpts.createDataDump(data,caller.WBTs[addr-1].SN);
      break;

    case 0b00011:
      // data test // 
      if(data[1] == 0){
        caller.WBTs[addr-1].WBTData["Data Test"] =  "Fail";
        return false;
      }
      caller.WBTs[addr-1].WBTData["Data Test"] =  "Pass";
      return true;

    case 0b00100:
      // charge cont.  // 
      caller.WBTs[addr-1].updateStatus("Charging");
      console.log(addr);
      var updates = standardParse(data,caller)
      caller.WBTs[addr-1].updateData(updates);
      var tempFlag = caller.WBTs[addr-1].checkWBUTemp([updates["WBU temp °C"],new Date().getTime()])
      if(tempFlag){
        sendCommand(caller.port,addr,"11111");
        caller.WBTs[addr-1].updateStatus("Shutdown");
      }
      break;

    case 0b00101:
      // impedance  // 
      caller.WBTs[addr-1].updateStatus("Impedence Test");
      let impd = ImpedanceParse(data)
      console.log(impd);
      caller.WBTs[addr-1].updateConsts(impd);
      caller.WBTs[addr-1].WBTData["Impedance (mOhms)"] = impd["Impedance (mOhms)"];
      break;

    case 0b00110:
      // trip test // 
      caller.WBTs[addr-1].updateStatus("Trip Test");
      let ttest = tripTestParse(data)
      caller.WBTs[addr-1].updateConsts(ttest); 
      caller.WBTs[addr-1].WBTData["Trip Test Time (ms)"] = ttest["Trip Test Time (ms)"];
      break;
    case 0b00111:
      // hold test  // 
      caller.WBTs[addr-1].updateStatus("Hold Test");
      var updates = standardParse(data,caller)
      caller.WBTs[addr-1].updateData(updates);
      var tempFlag = caller.WBTs[addr-1].checkWBUTemp([updates["WBU temp °C"],new Date().getTime()])
      if(tempFlag){
        sendCommand(caller.port,addr,"11111");
        caller.WBTs[addr-1].updateStatus("Shutdown");
      }
      break;
    case 0b01000:
      // full discharge // 
      caller.WBTs[addr-1].updateStatus("Discharging");
      var updates = standardParse(data,caller)
      caller.WBTs[addr-1].updateData(updates);
      var tempFlag = caller.WBTs[addr-1].checkWBUTemp([updates["WBU temp °C"],new Date().getTime()])
      if(tempFlag){
        sendCommand(caller.port,addr,"11111");
        caller.WBTs[addr-1].updateStatus("Shutdown");
      }
      break;
    case 0b01001:
      // store/ship  // 
      caller.WBTs[addr-1].updateStatus("Store/Ship Charge");
      var updates = standardParse(data,caller)
      caller.WBTs[addr-1].updateData(updates);
      var tempFlag = caller.WBTs[addr-1].checkWBUTemp([updates["WBU temp °C"],new Date().getTime()])
      if(tempFlag){
        sendCommand(caller.port,addr,"11111");
        caller.WBTs[addr-1].updateStatus("Shutdown");
      }
      break;
    case 0b11000:
      // atp complete //
      caller.WBTs[addr-1].clearData();
      caller.WBTs[addr-1].updateStatus("Idle"); 
      rpts.createReport("FULL_ATP",caller.WBTs[addr-1].SN,caller.WBTs[addr-1].firmwareVersion,caller.WBTs[addr-1].WBTData)
      break;
    case 0b11001:
      // test complete // 
      caller.WBTs[addr-1].WBTData[caller.WBTs[addr-1].status +" Test"] = "Pass";
      caller.WBTs[addr-1].clearData();
      break;
    case 0b11111:
      // general error // 
      // need to create display error functionality that can display errors on screen to technitian.
      caller.WBTs[addr-1].WBTData[caller.WBTs[addr-1].status +" Test"] = "Fail";
      break;
    default:
      //
      console.log("Unknown command:",data);
      break;

  }
}



function parseSelfTest(data){
  let errors = [];
  if((data & 0b1) == 0){
    errors.push("Charge test did not pass")
  }
  if((data & 0b10) == 0){
    errors.push("WBT temperature is out of operational range")
  }
  if((data & 0b100) == 0){
    errors.push("WBU NVM test failed")
  }
  if((data & 0b1000) == 0){
    errors.push("WBU temperature is out of operational range")
  }
  if(errors.length == 0 && data == 15){
    return true;
  }
  else{
    return errors;
  }
}

function parseSerialNumber(data,caller){
 
  let str = String.fromCharCode(data[1])
   + String.fromCharCode(data[2])
   let x1 = data[3].toString(16)
   let x2 = data[4].toString(16)
   let x3 = data[5].toString(16)
   let x4 = data[6].toString(16)

   if(parseInt(x1) < 10){
    x1 = "0" + x1;
   }
   if(parseInt(x2) < 10){
    x2 = "0" + x2;
   }
   if(parseInt(x3) < 10){
    x3 = "0" + x3;
   }
   if((x4) < 10){
    x4 = "0" + x4;
   }


  str += x1 + x2 + x3 + x4
  return str;
}

function standardParse(data, caller){
  let updates = {
    "WBU temp °C": (((data[1] << 8 | data[2]) / 2)-55), 
    "WBT temp °C": (((data[3] << 8 | data[4]) / (65535/175.0)) - 45), 
    "Voltage (V)": (data[5] * 0.064) + 2.88, 
    "Current (Amps)": Math.abs((((data[6] << 8 | data[7]) - 512) / 25.6))
  }
  let flag = false;
  if(caller.port != undefined){
    if(updates["WBU temp °C"] > 35 || updates["WBU temp °C"] < 15 ){ 
      //flag = true;
    }
    if(updates["Voltage (V)"] > 8.5 || updates["Voltage (V)"] < 5.0){
      //flag = true;
    }
    
  }
  // flag check was causing issues last minute, need to troubleshoot when first data package contains out-of-bounds values
  if(flag){ 
    caller.port.write(strtobuf((data[0] >> 5).toString() + "11111")) // will send shutdown command if flag true in block above
    caller.WBTs[(data[0]>>5)-1].clearData();
    caller.WBTs[(data[0]>>5)-1].updateStatus("Shutdown");
  }
  return updates;
}

function tripTestParse(data){
  let updates = {
    "Trip Test Time (ms)": data[1]
  }
  return updates;
}

function ImpedanceParse(data){
  let updates = {
    "Impedance (mOhms)": data[1] << 1
  }
  return updates;
}

function addToDOM(Address) {
  let wbtHTML = `
  <div class = 'WBTPanel' id = ${Number(Address) }>
    <div class = 'WBTHeader'>
      <div class = "nameAndStat">
        <h3>WBT ${Number(Address) }</h3>
        <div class = status>
          <h3>Status: </h3>
          <h3 class = 'curStatus'> Connected</h3>
        </div> 
      </div>
      <div class = 'WBUSNContainer'>
        <h3 class = 'WBUSN'>No WBU detected</h3>
      </div>
      <div class = 'controls'>
        <a>Command: </a>
        <select command = 'commandSelect'>
          <option value = ''></option>
          <option value = '00001'>Full ATP</option>
          <option value = '00010'>Charge</option>
          <option value = '00011'>Impedence</option>
          <option value = '00100'>Trip test</option>
          <option value = '00101'>Hold test</option> 
          <option value = '00110'>Discharge</option>
          <option value = '00111'>Storage/Shipping</option>
          <option value = '10001'>Data Dump</option>
          <option value = '10010'>Identify device</option>
          <option value = '11111'>Shutdown</option>
        </select>
        <button class = 'SendCommand' id = '${Address}'>Send Command</button>
      </div>
    </div>

    <div class = 'WBTContent'>
      <div class = 'WBTDataContentHeader'>
        <h3>WBT Data</h3>
        <div class = 'WBTDataConsts'>
        </div>
      </div>
      <div class = 'WBTDataContent'>
        <div class = 'Data'>
        </div>
      </div> 
    </div>

  </div>
`
  $("#WBTContainer").append(wbtHTML);
}

function noDevicesDetected(obj){
  document.getElementById("WBTContainer").innerHTML = "";
  const wbtHTML = 
  `<div id = "noDevices" class = modal">
    <div class = "modal-content">
      <p>No Devices Detected. Please check device connection click "Retry" when ready.</p>
      <button id = "Retry" >Retry</button>
    </div>
  </div>
  `
  if(document.getElementById("noDevices") == null){
    document.querySelector("#WBTContainer").insertAdjacentHTML('afterend', wbtHTML);
  }
  let btn = document.getElementById("Retry");
  btn.addEventListener("click", function(){
    document.getElementById("noDevices").remove();
    obj.initialize();
  })

}


export{ 
  strtobuf,
  sendCommand,
  decodeHandshakeResponse,
  decodeAdr,
  parseData,
  addToDOM,
  parseSerialNumber,
  noDevicesDetected
}
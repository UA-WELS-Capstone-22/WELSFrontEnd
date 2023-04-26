var $ = require( "jquery" );
import * as rpts from './printout.js';
function strtobuf(str){
  // might need more
  let buf = Buffer.alloc(0);
  buf = Buffer.alloc(1);
  buf.writeUInt8(parseInt(str,2));
  console.log("buf:",buf) // leaving in for now
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
      // self test // justs needs to know if pass or fail. t/f works
      let st = parseSelfTest(data[1])
      // caller.WBTs[addr-1].WBTData.set("Self_Test", st);
      return parseSelfTest(data[1]);
    case 0b00001:
      //Serial number // needs to return string to be updated (needs WBTList)
      return parseSerialNumber(data,"parseFunc");
    case 0b00010:
      // data dump // needs to be stored somewhere, maybe in WBT object? 
      console.log('dump hit?', data)
      rpts.createDataDump(data,caller.WBTs[addr-1].SN);
      break;
    case 0b00011:
      // data test // t/f
      if(data[1] == 0){
        caller.WBTs[addr-1].WBTData.set("Data_Test", false);
        return false;
      }
      caller.WBTs[addr-1].WBTData.set("Data_Test", true);
      return true;
    case 0b00100:
      // charge cont.  // needs to return string to be updated (needs WBTList)
      console.log(addr);
      caller.WBTs[addr-1].updateData(standardParse(data));;
      break;
    case 0b00101:
      // impedance  // returns impedance
      let impd = ImpedanceParse(data)
      console.log(impd);
      caller.WBTs[addr-1].updateData(impd);
      console.log(caller.WBTs[addr-1]);
      console.log(caller.WBTs[addr-1].WBTData);
      caller.WBTs[addr-1].WBTData["Impedance"] = impd["Impedance"];
      break;
    case 0b00110:
      // trip test // returns time
      let ttest = tripTestParse(data)
      caller.WBTs[addr-1].updateData(ttest); 
      caller.WBTs[addr-1].WBTData.set("Trip_Test_Time", ttest["Trip_Test_Time"]);
      break;
    case 0b00111:
      // hold test  // needs to return string to be updated (needs WBTList)
      caller.WBTs[addr-1].updateData(standardParse(data));
      break;
    case 0b01000:
      // full discharge // needs to return string to be updated (needs WBTList)
      caller.WBTs[addr-1].updateData(standardParse(data));
      break;
    case 0b01001:
      // store/ship  // needs to return string to be updated (needs WBTList)
      caller.WBTs[addr-1].updateData(standardParse(data));
      break;
    case 0b11000:
      // atp complete // generate report & update state to idle?
      caller.WBTs[addr-1].clearData();
      caller.WBTs[addr-1].updateState("idle"); // maybe add test complete state?
      break;
    case 0b11001:
      // test complete // generate report & updates state to idle?
      caller.WBTs[addr-1].clearData();
      break;
    case 0b11111:
      // general error // display error message on screen?
      // need to create display error functionality that can display errors on screen to technitian.
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
  if(errors == [] && data == 15){
    return true;
  }
  else{
    return errors;
  }
}

function parseSerialNumber(data,caller){
  // make hex aftr 3rd byte
  let str = String.fromCharCode(data[1])
   + String.fromCharCode(data[2])
   let x1 = data[3].toString(16)
   let x2 = data[4].toString(16)
   let x3 = data[5].toString(16)
   let x4 = data[6].toString(16)
  str += x1 + x2 + x3 + x4
  return str;
}

function standardParse(data, port){
  let updates = {
    WBU_temp: (((data[1] << 8 | data[2]) / 2)-55), 
    WBT_temp:(data[3] << 8 | data[4]), 
    Voltage: (data[5] * 0.064) + 2.88, 
    Current: Math.abs((((data[6] << 8 | data[7]) - 512) / 25.6))
  }
  let flag = false;
  if(port != undefined){
    // TODO: Implement function to check for 2 deg C delta in last 10 seconds
    if(updates.WBU_temp > 35 || updates.WBU_temp < 15 ){ 
      flag = true;
    }
    if(updates.Current > 4.0 || updates.Current < 0.25){
      flag = true;
    }
    if(updates.Voltage > 8.2 || updates.Voltage < 5.0){
      flag = true;
    }
    
  }
  if(flag){ 
    port.write(strtobuf((data[0] >> 5).toString() + "11111")) // will send shutdown command if flag true in block above
  }
  

  return updates;
}

function tripTestParse(data){
  let updates = {
    Trip_Test_Time: data[1]
  }
  return updates;
}

function ImpedanceParse(data){
  // confirm conversion
  let updates = {
    Impedance: data[1] << 1
  }
  return updates;
}

// add serial number to this 
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
var $ = require( "jquery" );
// import doc from 'pdfkit';
import * as rpts from './printout.js';
function strtobuf(str){
  // might need more
  let buf = Buffer.alloc(0);
  buf = Buffer.alloc(1);
  buf.writeUInt8(parseInt(str,2));
  // console.log("buf:",buf)
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
  let i = 0
  let addr = ((data[0] & 0xE0) >> 5);
  let cmd = data[0] & 0x1F;
  console.log(data);
  while (data.indexOf(i) === 0) {
    i++;
  }
  data = data.slice(i);

  switch (cmd) {
    case 0b00000:
      // self test // justs needs to know if pass or fail. t/f works
      return parseSelfTest(data[1]);
    case 0b00001:
      //Serial number // needs to return string to be updated (needs WBTList)
      return parseSerialNumber(data);
    case 0b00010:
      // data dump // needs to be stored somewhere, maybe in WBT object? 
      console.log('dump hit?', data)
      rpts.createDataDump(data);
      break;
    case 0b00011:
      // data test // t/f
      if(data[1] == 0){
        return false;
      }
      return true;
    case 0b00100:
      // charge cont.  // needs to return string to be updated (needs WBTList)
      console.log(addr);
      caller.WBTs[addr-1].updateData(standardParse(data));;
      break;
    case 0b00101:
      // impedance  // returns impedance
      break;
    case 0b00110:
      // trip test // returns time
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
      break;
    case 0b11001:
      // test complete // generate report & updates state to idle?
      break;
    case 0b11111:
      // general error // display error message on screen?
      break;
    default:
      //
      console.log("Unknown command:",data);
      break;

  }
}

function parseSelfTest(data){
  let errors = [];
  if(data & 1 == 0){
    errors.push("Charge test did not pass")
  }
  if(data & 2 == 0){
    errors.push("WBT temperature is out of operational range")
  }
  if(data & 4 == 0){
    errors.push("WBU NVM test failed")
  }
  if(data & 8 == 0){
    errors.push("WBU temperature is out of operational range")
  }
  return errors;
}

function parseSerialNumber(data){
  // make hex aftr 3rd byte
  let str = String.fromCharCode(data[3])
   + String.fromCharCode(data[4])
   + String(data[5])
   + String(data[6])
   + String(data[7])
   + String(data[8])
  return str;
}

function standardParse(data){
  let updates = {
    WBU_temp:(data[1] << 8 | data[2]), 
    WBT_temp:(data[3] << 8 | data[4]), 
    Voltage: data[5], 
    Current: data[6]
  }
  console.log(updates);
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
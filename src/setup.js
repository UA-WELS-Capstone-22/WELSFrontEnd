// imports
const { ByteLengthParser,DelimiterParser } = require("serialport");
const { SerialPort } = eval("require('serialport')");
const Buffer = require('buffer').Buffer;
import { WBT } from './WBT.js';
import * as utils from './utils.js';
import * as hs from './handshake.js';

//Serial communication funciton
//TODO: might not neede to iterate over all ports as only on wbt connects to pc/ get ary/ashton to advise ~ TBD
//TODO: add error handling ~ not started
//TODO: add data proceessing function ~ in progress
//TODO: after data is parsed, add to html ~ in progress - need to test further
//TODO: after handshake iterate through WBT list and send self test command waiting for response ~ started ~ need to add response handling for failed tests
//TODO: for test timing store start UTC time and END UTC time when end command Rx'ed then calc for later ~ not started

// WBT class
class WBTList {
  // constructor
  constructor() {
    this.WBTs = []; // array of WBT objects
    this.versionstr = "1.0"; // version of WBT software to check against //
    this.version = "10011"
    this.fwv = 0x10
    this.initialize(); // initialize serial port
  }

  // initialize serial port
  async initialize() {
    try {
      this.port = await this.getPortAndInitializeSerialPort();
      if(!this.port){
        // call function to display no devices detected message with button that on click will call initialize again
        utils.noDevicesDetected(this)
        return;
      }
      // need to test two bang delimiter works
      this.initParser("DelimiterParser", "!!");
      // this.initParser("ByteLengthParser", 1);

      this.port.on("open", () => {
        console.log(`port ${this.port.path} open`);
        this.Handshake();
      });

      this.parser.on("data", (data) => {
        console.log("data recieved");
        utils.parseData(this,data);
      });

      this.port.on("close", () => {
        console.log(`closing port ${this.port.path}`);
        // should anythign be done here?
      });
      // might need to add event listener for data recieved to be passed to parsing function could also be in elsewhere

    } catch (error) {
      console.error(error);
    }
  }

  // on connection to serial port, create and return SerialPort object 
  // Baud rate is 9600
  async getPortAndInitializeSerialPort() {
    //TODO: add error handling for when no device detected (ie add try catch)
    const port = await this.getPort();
    if(!port){
     return null;
    }
    else{
      return new SerialPort({
        path: port.path,
        baudRate: 9600,
      });
    }
  }

  // get list of com ports with device connected
  async getPort() {
    const ports = await SerialPort.list();
    // console.log("ports:", ports);
    if (!ports || !ports.length) {
      // devive not detected
      // throw new Error("No device connected");
      console.log("No device connected");
      console.log("ports:", ports);
    }
    else if(ports.length > 1) {
      // multiple devices detected
      // throw new Error("Multiple devices connected");
      for (let i = 0; i < ports.length; i++) {
        if(ports[i].productId == "6001" && ports[i].vendorId == "0403"){
          return ports[i];
        }
      }
    }
    else{
      return ports[0];
    }
  }

  // this function allows for chaning of parser type and value as needed
  // Arguemnts: type - type of parser to use (ByteLengthParser or DelimiterParser),
  //            value - value to be passed to parser (length for ByteLengthParser, delimiter:String for DelimiterParser)
  initParser(type = "ByteLengthParser", value = 1) {
    let parser;
    switch (type) {
      case "ByteLengthParser":
        parser = new ByteLengthParser({ length: value });
        break;
      case "DelimiterParser":
        parser = new DelimiterParser({ delimiter: value });
        break;
      default:
        parser = new ByteLengthParser({ length: 1 });
    }

    this.parser = parser; // save parser to class variable
    this.port.pipe(parser); // pipe parser to serial port

  }

  async Handshake() { 
    // wait 5 seconds before sending data as arduino resets on serial connection open event
    await new Promise((resolve) => setTimeout(resolve, 5000));
    // for loop to run up to 6 times as max supported WBTs is 6
    // r1 is the address response
    // r2 is the version response
    // if both are valid, then add WBT to WBTList
    // after r1 and r2 event listeners are removed, to save memory and prevent multiple listeners from being added
    // could add event listnr . data parsr for new device to add message
    for (let i = 1; i < 2; i++) {
      try{ // for instaces where no response is received / all wbt discovered
        let r1 = await hs.assignAddress(this.port,this.parser,(i & 0b111).toString(2).padStart(3,'0'));
        this.parser.removeAllListeners();
        let r2 = await hs.checkFirmwareVersion(this.port,this.parser,this.version,(i & 0b111).toString(2).padStart(3,'0'));
        this.parser.removeAllListeners();
        let r3 = await hs.selfTest(this.port,this.parser,(i & 0b111).toString(2).padStart(3,'0'))
        this.parser.removeAllListeners();
        let r4 = await hs.getSerialNumber(this.port,this.parser,(i & 0b111).toString(2).padStart(3,'0'))        
        this.parser.removeAllListeners();
        console.log(r4);
        // TODO: implement code below // add r3 once self test is done
        if (r1 && r2 && r3) {
          this.WBTs.push(new WBT(i, r2, this.port));
        }
      }
      catch(error){
        console.error(error);
        //TODO: on error here determine whether or not to display message to user of error
        //NOTE: console will not be available in final packaged app
      }
      this.parser._read(); // clear buffer
    }
    this.parser.on("data", (data) => {
    // //   // console.log(data);
    // //   // for datadump, ignore first byte if consistenly 0 
    // //   // rpts.createDataDump(data.slice(1));
    // //   // if(data[0] & 0b11111111 == 0b00010){
    // //   //   console.log('creating log')
    // //   //   rpts.createDataDump(data);
    // //   // }
    // //   // else{
    // //   //   console.log(data);
    // //   // }
    // //   // utils.parseData(data);

    // //   // 2 options:

    // //   /*
    // //   1) call parse function in utils, store response, then call function to act on response
    // //   2) call parse function in utils, pass in wbtList and give utils access to wbtList
    // //   3) move parse back to setup, have parse function call utils, and then parse can act on response
    // //   */

      utils.parseData(this,data);
    })
  }

  standardParse(addr,data){
    console.log(data);
    
    let updates = {
      WBU_temp:(data[1] << 8 | data[2]), 
      WBT_temp:(data[3] << 8 | data[4]), 
      Voltage: data[5], 
      Current: data[6]
    }
    this.WBTs[addr-1].updateData(updates);
  }

  impedanceParse(addr,data){
    let updates = {
      Impedance: data[1]
    }
    this.WBTs[addr-1].updateData(updates);
  }

  addWBT(WBT) {
    this.WBTs.push(WBT);
  }

  removeWBT(WBT) {
    const index = this.WBTs.indexOf(WBT);
    if (index !== -1) {
      this.WBTs.splice(index, 1);
    }
  }

  getWBT(id) {
    return this.WBTs.find((WBT) => WBT.id === id);
  }

  updateWBT(id, updates) {
    const WBT = this.getWBT(id);
    if (WBT) {
      Object.assign(WBT, updates);
    }
  }
}

var wbtList = new WBTList();
console.log(wbtList);

// adds event listener when the SendCommand button inside div with id "master" is clicked
document.getElementById(7).addEventListener("click", function () {
  // get the value of the input box
  let input = document.getElementById("MasterCmdVal").value;
  // send the value to the serial port
  utils.sendCommand(wbtList.port, 7 ,input);
  // need to creat function that will update all WBT status's

});

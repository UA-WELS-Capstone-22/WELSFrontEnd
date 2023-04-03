// imports
const { ByteLengthParser,DelimiterParser } = require("serialport");
const { SerialPort } = eval("require('serialport')");
const { path } = eval("require('path')");
const { stat } = require("original-fs");
const Buffer = require('buffer').Buffer;
import { WBT } from './WBT.js';
import * as utils from './utils.js';

// import { serialObj } from './serialObj.js';
//Serial communication funciton
//TODO: might not neede to iterate over all ports as only on wbt connects to pc/ get ary/ashton to advise ~ TBD
//TODO: add error handling ~ not started
//TODO: add data proceessing function ~ not started
//TODO: after data is parsed, add to html ~ in progress
//TODO: creat write function so we are always writing in byte encoding ~ started
//TODO: after handshake iterate through WBT list and send self test command waiting for response ~ started
//TODO: update firmware version checking function to integerts to request  ~ not started
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
      // need to test two bang delimiter works
      this.initParser("DelimiterParser", "!!");
      // this.initParser("ByteLengthParser", 1);

      this.port.on("open", () => {
        console.log(`port ${this.port.path} open`);
        this.Handshake();
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
    return new SerialPort({
      path: port.path,
      baudRate: 9600,
    });
  }

  // get list of com ports with device connected
  async getPort() {
    const ports = await SerialPort.list();
    if (!ports || !ports.length) {
      // devive not detected
      throw new Error("No device connected");
    }
    return ports[0];
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
        let r1 = await this.assignAddress((i & 0b111).toString(2).padStart(3,'0'));
        this.parser.removeAllListeners();
        let r2 = await this.checkFirmwareVersion(this.version,(i & 0b111).toString(2).padStart(3,'0'));
        this.parser.removeAllListeners();
        let r3 = await this.selfTest((i & 0b111).toString(2).padStart(3,'0'))
        this.parser.removeAllListeners();
        // this.parser.removeAllListeners();
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
    }
    this.parser.on("data", (data) => {
      console.log(data);
      // utils.parseData(data);

      // 2 options:

      /*
      1) call parse function in utils, store response, then call function to act on response
      2) call parse function in utils, pass in wbtList and give utils access to wbtList
      3) move parse back to setup, have parse function call utils, and then parse can act on response
      */

      // this.parseData(data);
    })
  }

  async assignAddress(Addr) {
    // Promise to send address and wait for response / timeout if failed
    return new Promise((resolve, reject) => {
      this.port.write(utils.strtobuf(Addr),  () => {
        let timeoutId = setTimeout(() => {
          reject(new Error("No response from WBT" + Addr.toString()));
        }, 3000);

        // could change delimiter if 1st wbt is sending addr back and causing error
        // could also solve this by adding dest addrs by specifing msg is for host
        // or my understanding is just wrong

        // below is event listener for data received from serial port
        this.parser.on("data", (data) => {

          // confirm that data received is the same as the address sent and has been ACK'ed
          let response = utils.decodeAdr(data);
          if(response === "ACK"){
            clearTimeout(timeoutId); // clear timeout if response received
            // console.log("Response received for address: ",String.fromCharCode(data[0])); // log response received // commented out for testing
            resolve(response[0]); // returns data // DO NOT COMMENT OUT
          }
          else if(response === Addr.toString()){
            // do nothing as this is a NACK
            // TODO: test this
            console.log("NACK received for address: ",String.fromCharCode(data[0]));  
          }
          else{
            reject(new Error("No response from WBT Address Assignment"));
          }
        });
      });

    });
  }
  
  //NOTE: this function should do a compantibility check with the WBT not just check equality 
  async checkFirmwareVersion(firmwareVersion,addr) {
    // Promise to send firmware version and wait for response / timeout if failed
    return new Promise((resolve, reject) => {
      this.port.write(utils.strtobuf(addr+firmwareVersion), () => {
        let timeoutId = setTimeout(() => {
          reject(new Error("No response from WBT Firmware not Rx'ed")); // reject promise
        }, 3000);
        // event listener for data received from serial port
        this.parser.on("data", (data) => {     
          // evaluate if firmware version received is compatible with firmware version sent
          let response = utils.decodeHandshakeResponse(data);
          console.log('response:',response);
          if (response === this.versionstr) {
            clearTimeout(timeoutId); // clear timeout if response received
            //console.log("Response received for version: ",this.decodeHandshakeResponse(data));  // log response received // commented out for testing
            resolve(response); // returns data // DO NOT COMMENT OUT
          }
          else{
            //console.log("did not match in 241")
             reject(data); // reject promise if firmware version received is not compatible with firmware version sent 
            // TODO: evaluate above reject if should be different ie sending an error message to user instead of data
          }
      });
      
    });
  });
  } 

  async selfTest(Addr){
    return new Promise((resolve, reject) => {
      this.port.write(utils.strtobuf(Addr+'10000'),"binary", () => {
        let timeoutId = setTimeout(() => {
          reject(new Error("No response from WBT, Self-test not Rx'ed")); // reject promise
        }, 2000);
        // event listener for data received from serial port
        this.parser.on("data", (data) => {     
          // evaluate if self test passed
          // console.log(data)
          // remove === 0 for testing
          let response = utils.parseData(data);
          if (response.length === 0) {
            clearTimeout(timeoutId); // clear timeout if response received
            console.log("Response received for self test: ",data);  // log response received // commented out for testing
            resolve(data[0]); // returns data // DO NOT COMMENT OUT
          }
          else{
            // console.log(data);
            for(msg in data){
              console.log(msg);
            }
             reject(data); // reject promise if self test did not pass
            // TODO: evaluate above reject if should be different ie sending an error message to user instead of data
          }
      });
      
    });
  });
}
    // Parse function (WIP)
  parseData(data) {
    let addr = (data[0] & 0xE0) >> 5 // verify
    let format = data[0] & 0x1F
    console.log(data);
    console.log(format);

    // if(format >= 1 && format <= 5){
    //     this.standardParse(addr,data)
    // }

    // if (data.length == 7) {
    //   let address = data[0];
    //   console.log(address);
    //   let WBUTemp = data.slice(1, 3);
    //   console.log(((WBUTemp[0] & 0xff) << 8) | (WBUTemp[1] & 0xff));
    //   let WBTTemp = data.slice(3, 5);
    //   console.log(((WBTTemp[0] & 0xff) << 8) | (WBTTemp[1] & 0xff));
    //   let Voltage = data[5];
    //   console.log(Voltage);
    //   let Current = data[6];
    //   console.log(Current);
    // } else {
    //   console.log(data);
    // }
    
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

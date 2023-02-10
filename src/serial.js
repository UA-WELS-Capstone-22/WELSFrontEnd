// imports
const { ByteLengthParser,DelimiterParser } = require("serialport");
const { SerialPort } = eval("require('serialport')");
const { path } = eval("require('path')");
var $ = require( "jquery" );
const { stat } = require("original-fs");
// import parseData from './parse.js';

//Serial communication funciton
//TODO: might not neede to iterate over all ports as only on wbt connects to pc/ get ary/ashton to advise
//TODO: add error handling
//TODO: add data proceessing function
//TODO: after data is parsed, add to html

/*
async function readSerial() {
  // gets list of com ports with device connected
  const port = await SerialPort.list();
  
  async (port) => {
    // creates a new serial port object
    const portToRead = new SerialPort({ path: port.path , baudRate: 9600, parser: new ReadlineParser('\n') });

    // opens the port
    portToRead.on("open", () => {
      console.log(`port ${port.path} open`);
      setInterval(async () => {
        try {
          await portToRead.write("hello from electron");
        } catch (err) {
          console.error(err);
        }
      }, 1000);
    });
    
    // reads data from serial port
    portToRead.on('data', (data) => {
      console.log(data)
      // document.getElementById('serial').innerText = data[0].toString()
    })

    // closes the port
    portToRead.on("close", () => {
      console.log(`closing port ${port.path}`);
    });portToRead.close();
  };

}readSerial();
*/


// WBT class
class WBTList {
  // constructor
  constructor() {
    this.WBTs = []; // array of WBT objects
    this.version = "1.0"; // version of WBT software to check against //
    this.initialize(); // initialize serial port
  }

  // initialize serial port
  async initialize() {
    try {
      this.port = await this.getPortAndInitializeSerialPort();
      this.initParser("DelimiterParser", "!");
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

  // Parse function (WIP)
  parseData(data) {
    if (data.length == 7) {
      let address = data[0];
      console.log(address);
      let WBUTemp = data.slice(1, 3);
      console.log(((WBUTemp[0] & 0xff) << 8) | (WBUTemp[1] & 0xff));
      let WBTTemp = data.slice(3, 5);
      console.log(((WBTTemp[0] & 0xff) << 8) | (WBTTemp[1] & 0xff));
      let Voltage = data[5];
      console.log(Voltage);
      let Current = data[6];
      console.log(Current);
    } else {
      console.log(data);
    }
  }
  
  async Handshake() { 
    // wait 5 seconds before sending data as arduino resets on serial connection open event
    await new Promise((resolve) => setTimeout(resolve, 5000));
    // for loop to run up to 6 times as max supported WBTs is 6
    // r1 is the address response
    // r2 is the version response
    // if both are valid, then add WBT to WBTList
    // after r1 and r2 event listeners are removed, to save memory and prevent multiple listeners from being added
    for (let i = 0; i < 5; i++) {
      try{ // for instaces where no response is received / all wbt discovered
        let r1 = await this.assignAddress(i);
        this.parser.removeAllListeners();
        // console.log(r1); // commented out for testing
        let r2 = await this.checkFirmwareVersion(this.version);
        // this.port.parser.off("data", () => {}); // commented out for potential future use if needed
        this.parser.removeAllListeners();
        // console.log(r2); // commented out for testing
        // await new Promise((resolve) => setTimeout(resolve, 100)); // commented out for testing

        // TODO: implement code below
        if (r1 && r2) {
          this.WBTs.push(new WBT(r1, r2));
        }
      }
      catch(error){
        console.error(error);
        //TODO: on error here determine whether or not to display message to user of error
        //NOTE: console will not be available in final packaged app
      }
    }
  }

  async assignAddress(Addr) {
    // Promise to send address and wait for response / timeout if failed
    return new Promise((resolve, reject) => {
      this.port.write(Addr.toString(), () => {
        // console.log("Address sent: ", i.toString()); // commented out for testing
        let timeoutId = setTimeout(() => {
          console.error("No response from WBT1");
          reject(new Error("No response from WBT1"));
        }, 3000);

        // could change delimiter if 1st wbt is sending addr back and causing error
        // could also solve this by adding dest addrs by specifing msg is for host
        // or my understanding is just wrong

        // below is event listener for data received from serial port
        this.parser.on("data", (data) => {
          // console.log(data); // log data received from serial port // commented out for testing
          // console.log(this.decodeHandshakeResponse(data));
          // confirm that data received is the same as the address sent and has been ACK'ed
          let response = this.decodeHandshakeResponse(data);
          if(response === Addr.toString()+"ACK"){
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
  async checkFirmwareVersion(firmwareVersion) {
    // Promise to send firmware version and wait for response / timeout if failed
    return new Promise((resolve, reject) => {
      // send firmware version to WBT
      this.port.write(firmwareVersion, () => {
        // console.log("Version sent: ", firmwareVersion); // commented out for testing
        // set timeout for 2 seconds
        let timeoutId = setTimeout(() => {
          // console.error("No response from WBT Firmware not Rx'ed"); // log error // commented out for testing
          reject(new Error("No response from WBT Firmware not Rx'ed")); // reject promise
        }, 2000);
        // event listener for data received from serial port
        this.parser.on("data", (data) => {     
          // evaluate if firmware version received is compatible with firmware version sent
          let response = this.decodeHandshakeResponse(data);
          if (response === firmwareVersion) {
            clearTimeout(timeoutId); // clear timeout if response received
            // console.log("Response received for version: ",this.decodeHandshakeResponse(data));  // log response received // commented out for testing
            resolve(response); // returns data // DO NOT COMMENT OUT
          }
          else{
            // console.log("did not match in 241")
            reject(data); // reject promise if firmware version received is not compatible with firmware version sent 
            // TODO: evaluate above reject if should be different ie sending an error message to user instead of data
          }
      });
      
    });
  });
} 
  // function to decode handshake response
  // NOTE: data recieved from serial port is ASCII values with max value of 255
  decodeHandshakeResponse(data) {
    let str = ''; // string to store decoded data
    for (let i = 0; i < data.length; i++) {
      str += String.fromCharCode(data[i]); // convert data to string
    }
    return str;
  }
  // NOTE: will likely need many decode functions here is good



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

class WBT {
  constructor(address, firmwareVersion) {
    this.WBTAddress = address; // address of WBT
    this.firmwareVersion = firmwareVersion; // firmware version of WBT
    this.status = "Connected"; // status of WBT
    this.WBTData = []; // array to store data from WBT
    this.addToDOM(); // add WBT to DOM
  }
  
  // needs to be better way but this works
  addToDOM() {
    let wbtHTML = `
      <div class = 'WBTPanel'>
      <div class = 'WBTHeader'>
        <div class = "nameAndStat">
          <h3>WBT ${Number(this.WBTAddress) + 1}</h3>
          <div class = status>
            <h3>Status: </h3>
            <h3 class = 'curStatus'>${this.status}</h3>
          </div> 
        </div>
        <div class = 'controls'>
          <a>Command: </a>
          <select command = 'commandSelect'>
            <option value = ''></option>
            <option value = '00011'>Full ATP</option>
            <option value = '00100'>Charge</option>
            <option value = '00101'>Discharge</option>
            <option value = '00111'>Storage/Shipping</option>
            <option value = '11111'>Shutdown</option>
          </select>
          <button class = 'SendCommand' id = '${this.WBTAddress}'>Send Command</button>
        </div>
      </div>

      <div class = 'WBTContent'>
        <div class = 'WBTDataContent'>
          <div class = 'WBTDataContentHeader'>
            <h3>WBT Data</h3>
          </div>
        </div> 
      </div>

      </div>
`
    $("#WBTContainer").append(wbtHTML);
  }
  

}

var wbtList = new WBTList();
console.log(wbtList);

// executeBttn = document.getElementById('1');

// executeBttn.addEventListener('click', () => {
//   console.log($('select').val());
//   x = $('select').val();
//   wbtList.port.write(x);
// })










// parseData();
// simple function to read from serial port and print to console


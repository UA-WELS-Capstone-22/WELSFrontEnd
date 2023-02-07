// imports
const { ByteLengthParser } = require("serialport");
const { SerialPort } = eval("require('serialport')");
const { path } = eval("require('path')");
var $ = require( "jquery" );
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



class WBTList {
  constructor() {
    this.WBTs = [];
    this.initialize();
  }

  async initialize() {
    try {
      // gets list of com ports with device connected then initializes serial port object
      this.port = await this.getPort()
      .then( (port) => new SerialPort(
        { path: port.path, 
          baudRate: 9600
      }));

      // creates a new Parser reading 7 bytes at a time
      this.parser = new ByteLengthParser({length: 7});
      // pipes the serial port to the parser
      this.port.pipe(this.parser);

      // On data event, parse the data calling parseData function
      this.parser.on('data', (data) => {
        this.parseData(data);
      });

      // opens the port
      this.port.on("open", () => {
        console.log(`port ${this.port.path} open`);
        // TODO: make this call handskake function
      });

    } catch (error) {
      console.error(error);
    }
  }

  async getPort() {
    const ports = await SerialPort.list();
    if (!ports || !ports.length) {
      throw new Error("No device connected");
    }
    return ports[0];
  }

  // parses data from serial port
  parseData(data) {
    // TODO: add error handling
    // TODO: add data proceessing function
    // TODO: after data is parsed, fowrard to WBT object
    // TODO: maybe add to html here?
    let address = data.slice(0,1);
    console.log(address[0])
    let WBUTemp = data.slice(1,3);
    console.log(( (WBUTemp[0] & 0xFF) << 8) | (WBUTemp[1] & 0xFF) );
    let WBTTemp = data.slice(3,5);
    console.log(( (WBTTemp[0] & 0xFF) << 8) | (WBTTemp[1] & 0xFF) )
    let Voltage = data.slice(5);
    console.log(Voltage[0])
    let Current = data.slice(6);
    console.log(Current[0])
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
    return this.WBTs.find(WBT => WBT.id === id);
  }

  updateWBT(id, updates) {
    const WBT = this.getWBT(id);
    if (WBT) {
      Object.assign(WBT, updates);
    }
  }
}

class WBT {
  constructor() {
    this.WBTID = 0;
    this.WBTAddress = '';
    this.WBTStatus = '';
  }
}

var wbtList = new WBTList();
console.log(wbtList);

executeBttn = document.getElementById('1');

executeBttn.addEventListener('click', () => {
  console.log($('select').val());
  x = $('select').val();
  wbtList.port.write(x);
})









// parseData();
// simple function to read from serial port and print to console

// html for wbt panel, will be dynamically generated and added per wbt
/*
        <div class = 'WBTPanel'>

          <div class = 'WBTHeader'>
            <div class = "nameAndStat">
              <h3>WBT 1</h3>
              <div class = status>
                <h3>Status:</h3>
                <h3 class = 'curStatus'>Idle</h3>
              </div> 
            </div>
            <div class = 'controls'>
            <select command = 'commandSelect'>
              <option value = '0'></option>
              <option value = '1'>Full ATP</option>
              <option value = '2'>Charge</option>
              <option value = '3'>Discharge</option>
              <option value = '4'>Storage/Shipping</option>
              <option value = '5'>Shutdown</option>
            </select>
            <button class = 'SendCommand'>Execute</button>
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
  */
// imports
const { ReadlineParser } = require("serialport");
const { SerialPort } = eval("require('serialport')");
const { path } = eval("require('path')");

//Serial communication funciton
async function writeSerial() {
  // gets list of com ports with device connected
  const ports = await SerialPort.list();
  // loops through each port
    ports.forEach(async (currentPort) => {

    // creates a new serial port object
    const portToWrite = new SerialPort({ path: currentPort.path , baudRate: 9600, parser: new ReadlineParser('\n') });

    // opens the port
      portToWrite.on("open", () => {
        console.log(`port ${currentPort.path} open`);
        setInterval(async () => {
          try {
            await portToWrite.write("hello from electron");
          } catch (err) {
            console.error(err);
          }
        }, 1000);
      });
      
      // reads data from serial port
      portToWrite.on('data', (data) => {
        console.log(data)
        document.getElementById('serial').innerText = data[0].toString()
      })


      // closes the port
      portToWrite.on("close", () => {
        console.log(`closing port ${currentPort.path}`);
      });portToWrite.close();
    });
}writeSerial();

// simple function to read from serial port and print to console


const { SerialPort } = eval("require('serialport')")

//function to enumerat over connectd serial ports
// function listSerialPorts() {
//     SerialPort.list().then(
//         ports => ports.forEach(port => console.log(port.path)),
//         err => console.error(err)
//     )
// }listSerialPorts();

// async function that writes to comport 3 every second
//  function writeSerial() {
//     const port = new SerialPort('COM3', { baudRate: 9600 })
//     while (port.isOpen) {
//         console.log('port open')
//         setInterval(async () => {
//             try {
//                 await port.write('hello from electron');
//             } catch (err) {
//                 console.error(err);
//             }
//         }, 1000);
//     }
//     port.on('open', () => {
//         console.log('port open')
//         setInterval(async () => {
//             try {
//                 await port.write('hello from electron');
//             } catch (err) {
//                 console.error(err);
//             }
//         }, 1000);
        
//     })
// }writeSerial();

// async function that connects and writes to all open com ports every second
// async function writeSerial() {
//     const ports = await SerialPort.list();
//     ports.forEach(async port => {
//         const port = new SerialPort(port.path, { baudRate: 9600 })
//         port.on('open', () => {
//             console.log('port open')
//             setInterval(async () => {
//                 try {
//                     await port.write('hello from electron');
//                 } catch (err) {
//                     console.error(err);
//                 }
//             }, 1000);
//         })
//     })
// }writeSerial();


async function writeSerial() {
    const ports = await SerialPort.list();
    ports.forEach(async currentPort => {
        const portToWrite = new SerialPort(currentPort.path, { baudRate: 9600 });
        portToWrite.on('open', () => {
            console.log(`port ${currentPort.path} open`);
            setInterval(async () => {
                try {
                    await portToWrite.write('hello from electron');
                } catch (err) {
                    console.error(err);
                }
            }, 1000);
        });
        portToWrite.on("close", () => {
            console.log(`closing port ${currentPort.path}`);
        });
        portToWrite.close();
    });
}
writeSerial();

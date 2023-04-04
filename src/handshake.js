import * as utils from './utils.js';

function assignAddress(port,parser,Addr) {
    // Promise to send address and wait for response / timeout if failed
    return new Promise((resolve, reject) => {
      port.write(utils.strtobuf(Addr),  () => {
        let timeoutId = setTimeout(() => {
          reject(new Error("No response from WBT" + Addr.toString()));
        }, 3000);

        // could change delimiter if 1st wbt is sending addr back and causing error
        // could also solve this by adding dest addrs by specifing msg is for host
        // or my understanding is just wrong

        // below is event listener for data received from serial port
        parser.on("data", (data) => {

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
function checkFirmwareVersion(port,parser,firmwareVersion,addr) {
    // Promise to send firmware version and wait for response / timeout if failed
    return new Promise((resolve, reject) => {
      port.write(utils.strtobuf(addr+firmwareVersion), () => {
        let timeoutId = setTimeout(() => {
          reject(new Error("No response from WBT Firmware not Rx'ed")); // reject promise
        }, 3000);
        // event listener for data received from serial port
        parser.on("data", (data) => {     
          // evaluate if firmware version received is compatible with firmware version sent
          let response = utils.decodeHandshakeResponse(data);
          console.log('response:',response); 
          // update later
          if (response == "1.0") {
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

function  selfTest(port,parser,Addr){
    return new Promise((resolve, reject) => {
      port.write(utils.strtobuf(Addr+'10000'),"binary", () => {
        let timeoutId = setTimeout(() => {
          reject(new Error("No response from WBT, Self-test not Rx'ed")); // reject promise
        }, 2000);
        // event listener for data received from serial port
        parser.on("data", (data) => {     
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


  function  getSerialNumber(port,parser,Addr){
    return new Promise((resolve, reject) => {
      port.write(utils.strtobuf(Addr+'10100'),"binary", () => {
        let timeoutId = setTimeout(() => {
          reject(new Error("No response from WBT, SN Rx'ed")); // reject promise
        }, 2000);
        // event listener for data received from serial port
        parser.on("data", (data) => {     
          // evaluate if self test passed
          // console.log(data)
          // remove === 0 for testing
          let response = data;
          if (response) {
            clearTimeout(timeoutId); // clear timeout if response received
            console.log("Response received for SN: ",data);  // log response received // commented out for testing
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


export{
    assignAddress,
    checkFirmwareVersion,
    selfTest,
    getSerialNumber
}
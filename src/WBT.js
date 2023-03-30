var $ = require( "jquery" );
import {createReport} from './printout.js';
class WBT {
    constructor(address, firmwareVersion,port) {
      this.WBTAddress = address; // address of WBT
      this.firmwareVersion = firmwareVersion; // firmware version of WBT
      this.status = "Connected"; // status of WBT
      this.port = port
      this.WBTData = {}; // array to store data from WBT
      this.addToDOM(); // add WBT to DOM
      let str = ".WBTPanel#"+(Number(address))
      this.$domRef = $(str);
      this.$domStatus = this.$domRef.find("h3.curStatus");
      this.$domdata = this.$domRef.find("div.Data");
      this.$cmdButton = this.$domRef.find("button");
      this.$cmdSelect = this.$domRef.find("select");
      this.$cmdButton.on("click", () => {
        if (this.$cmdSelect.val() != ""){
          this.sendCommand(this.$cmdSelect.val());
          // createReport(); // need to figure where and when to cal function, may get moved to setup.js
        }
      });
      
    }
    
    // needs to be better way but this works
    addToDOM() {
      let wbtHTML = `
      <div class = 'WBTPanel' id = ${Number(this.WBTAddress) }>
        <div class = 'WBTHeader'>
          <div class = "nameAndStat">
            <h3>WBT ${Number(this.WBTAddress) }</h3>
            <div class = status>
              <h3>Status: </h3>
              <h3 class = 'curStatus'> ${this.status}</h3>
            </div> 
          </div>
          <div class = 'controls'>
            <a>Command: </a>
            <select command = 'commandSelect'>
              <option value = ''></option>
              <option value = '00001'>Full ATP</option>
              <option value = '00010'>Charge</option>
              <option value = '00110'>Discharge</option>
              <option value = '00111'>Storage/Shipping</option>
              <option value = '11111'>Shutdown</option>
            </select>
            <button class = 'SendCommand' id = '${this.WBTAddress}'>Send Command</button>
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
    
    updateData(data){
      for(let key in data){
        let qry = "#"+key
        let dataItem = this.domdata.find(qry)
        if(dataItem.length == 0){
          this.domdata.append(
            `
            <p class = 'dataItem' id = '${key}'> ${key} : ${data[key]} </p>
            `
          )
        }
        else{
          dataItem.text(
            `
            ${key} : ${data[key]} 
            `
          )
        }
      }
    }
    
    sendCommand(cmd){
      let msg = this.strtobuf((Number(this.WBTAddress) & 0b111).toString(2).padStart(3,'0') + cmd,"binary" )
      this.port.write(msg);
    }

    strtobuf(str){
      // might need more
      let buf = Buffer.alloc(0);
      buf = Buffer.alloc(1);
      buf.writeUInt8(parseInt(str,2));
      // console.log("buf:",buf)
      return buf
    }
  
  }

  
export { WBT };
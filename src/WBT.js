var $ = require( "jquery" );
import * as utils from './utils.js';
import {createReport,createDataDump} from './printout.js';
class WBT {
    constructor(address, firmwareVersion,port) {
      this.WBTAddress = address; // address of WBT
      this.firmwareVersion = firmwareVersion; // firmware version of WBT
      this.status = "Connected"; // status of WBT
      this.port = port
      this.SN = ""; // serial number of WBT
      this.WBTData = {}; // array to store data from WBT
      utils.addToDOM(address); // add WBT to DOM
      let str = ".WBTPanel#"+(Number(address))
      this.$domRef = $(str);
      this.$domStatus = this.$domRef.find("h3.curStatus");
      this.$domdata = this.$domRef.find("div.Data");
      this.$cmdButton = this.$domRef.find("button");
      this.$cmdSelect = this.$domRef.find("select");
      this.$cmdButton.on("click", () => {
        if (this.$cmdSelect.val() != ""){
          utils.sendCommand(this.port, this.WBTAddress, this.$cmdSelect.val());
          // may need update status function call here absed on command
          // createReport(); // need to figure where and when to cal function, may get moved to setup.js
        }
      });
      
    }
    
    // needs to be better way but this works

    
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
    
    updateStatus(status){
      this.status = status;
      this.$domStatus.text(this.status);
    }

    updateSN(SN){
      this.SN = SN;
      this.$domRef.find("h3").text("WBT " + this.WBTAddress + " SN: " + this.SN);
    }

    clearData(){
      this.$domdata.empty();
    }



  
  }

  
export { WBT };
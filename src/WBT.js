var $ = require( "jquery" );
import * as utils from './utils.js';
import {createReport,createDataDump} from './printout.js';
class WBT {
    constructor(address, firmwareVersion, selfTestRestult, port, SerialNum) {
      this.WBTAddress = address; // address of WBT
      this.firmwareVersion = firmwareVersion; // firmware version of WBT
      this.status = "Idle"; // status of WBT
      this.port = port
      this.SN = SerialNum; // serial number of WBT
      this.tempArray = []; // array to store temperature data from WBT
      this.WBTData = {"Self Test Result": selfTestRestult }; // array to store data from WBT // will store data from various tests
      utils.addToDOM(address); // add WBT to DOM
      let str = ".WBTPanel#"+(Number(address))
      this.$domRef = $(str);
      this.$domStatus = this.$domRef.find("h3.curStatus");
      this.$domdata = this.$domRef.find("div.Data");
      this.$domDataHeader = this.$domRef.find("div.WBTDataConsts");
      this.$cmdButton = this.$domRef.find("button");
      this.$cmdSelect = this.$domRef.find("select");
      if(SerialNum != undefined){
        this.updateSN();
      }
      this.$cmdButton.on("click", () => {
        if (this.$cmdSelect.val() != ""){
          utils.sendCommand(this.port, this.WBTAddress, this.$cmdSelect.val());
          // console.log();
          // this.updateStatus(this.$cmdSelect[0].options[this.$cmdSelect[0].selectedIndex].text); // idk if this works
          // may need update status function call here absed on command
          // createReport(this.$cmdSelect[0].options[this.$cmdSelect[0].selectedIndex].text,this.SN); // need to figure where and when to cal function, may get moved to setup.js
        }
      });
      
    }
    
    // needs to be better way but this works

    
    updateData(data){
      for(let key in data){
        let qry = "#"+key.replace(/[()\s]+/g, '')
        let dataItem = this.$domdata.find(qry)
        if(dataItem.length == 0){
          this.$domdata.append(
            `
            <p class = 'dataItem' id = '${key.replace(/[()\s]+/g, '')}'> ${key} : ${data[key].toFixed(3)} </p>
            `
          )
        }
        else{
          dataItem.text(
            `
            ${key} : ${data[key].toFixed(3)} 
            `
          )
        }
      }
    }
    
    updateConsts(consts){
      for(let key in consts){
        let qry = "#"+key.replace(/[()\s]+/g, '')
        let dataItem = this.$domDataHeader.find(qry)
        if(dataItem.length == 0){
          this.$domDataHeader.append(
            `
            <p class = 'dataItem' id = '${key.replace(/[()\s]+/g, '')}'> ${key} : ${consts[key]} </p>
            `
          )
        }
        else{
          dataItem.text(
            `
            ${key} : ${consts[key]} 
            `
          )
        }
      }
    }

    updateStatus(status){
      this.status = status;
      this.$domStatus.text(this.status);
    }

    updateSN(){
      console.log(this.$domRef.find("h3.WBUSN"));
      let sts = this.$domRef.find("h3.WBUSN")
      console.log(sts);
      sts.text(`WBU SN: ${this.SN}`);
    }

    clearData(){
      this.$domdata.empty();
      this.updateStatus("Idle");
    }

    checkWBUTemp(data){
      // WBUtemp is array of toupls [(temp,time1),(temp,time2),...]
      // maintains last 2 seconds of data 
      // if temp delta is greater than 2 deg C, return true
      // else return false
      let CurTemp = data[0];
      let CurTime = data[1];
      console.log("check Temp",data);
      console.log("tempArray",this.tempArray);
      if(this.tempArray.length == 0){
        this.tempArray.push([CurTemp,CurTime]);
        return false;
      }
      else{ // might need to add time check/alt behavior here
        let timeDelta = Math.abs(this.tempArray[0][1] - CurTime) / 1000;
        console.log("timeDeltaInit",timeDelta);
        while(timeDelta > 10 && this.tempArray.length > 1){ // may have issues with this
          this.tempArray.shift();
          timeDelta = Math.abs(this.tempArray[0][1] - CurTime) / 1000;
          console.log("timeDelta While",timeDelta);
        }
        console.log("timeDelta final",timeDelta);
        let tempDelta = Math.abs(this.tempArray[0][0] - CurTemp);
        if(tempDelta > 2 && timeDelta < 10){
          this.tempArray[0] = [CurTemp,CurTime];
          this.clearData();
          return true;
        }
        else{
          this.tempArray.push([CurTemp,CurTime]);
          return false;
        }
      }
    }


  
  }

  
export { WBT };
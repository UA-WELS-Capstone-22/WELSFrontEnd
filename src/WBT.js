var $ = require( "jquery" );
class WBT {
    constructor(address, firmwareVersion) {
      this.WBTAddress = address; // address of WBT
      this.firmwareVersion = firmwareVersion; // firmware version of WBT
      this.status = "Connected"; // status of WBT
      this.WBTData = {}; // array to store data from WBT
      this.addToDOM(); // add WBT to DOM
      let str = ".WBTPanel#"+(Number(address))
      this.domRef = $(str);
      this.domStatus = this.domRef.find("h3.curStatus");
      this.domdata = this.domRef.find("div.Data");
  
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
  
  
  }

  
export { WBT };
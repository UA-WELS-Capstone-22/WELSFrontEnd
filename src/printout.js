// a pop up window which stores the file path selected by the user
const remote = require('@electron/remote');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { dialog } = remote;
import * as utils from './utils.js';

const modalHtml =`<div id="myModal" class="modal">
<div class="modal-content">
  <span class="close">&times;</span>
  <p>Choose a directory to save the output files to.</p>
  <input type="file" id="fileElem" multiple accept="*/*" webkitdirectory mozdirectory msdirectory odirectory directory style="display:none" onchange="handleFiles(this.files)">
  <button id="fileSelect">Select Directory</button>
</div>
</div>`

if (document.getElementById('myModal') == null) {
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}


var openFile = () =>  {
  dialog.showOpenDialog({ properties: ['openDirectory'] }).then(result => {
    pth = result.filePaths[0]
    document.getElementById('myModal').style.display = "none";
    if (pth == undefined) {
      return;
    }else{
    dirLabel.innerText = pth
    }
    document.getElementById('myModal').style.display = "none";
  }
  ).catch(err => {
    console.log(err)
  })
}


var updateCss = () =>{
  document.getElementById('myModal').style.display = "none";
}

let setFileDir = document.getElementById('fileSelect');
setFileDir.addEventListener('click', openFile);
let updateDir = document.getElementById('changeDir');
updateDir.addEventListener('click', openFile);
let dirLabel = document.getElementById('curDir');

var pth = ''

let closeFileSelect = document.getElementsByClassName('close')[0];
closeFileSelect.addEventListener('click',updateCss);

function createReport(Test,SN,FW,data){
  const doc = new PDFDocument();
  doc.font('Times-Roman').fontSize(20).text('WBU Test Report', 100, 100);
  doc.moveDown();
  doc.font('Times-Roman').text('WBT firmware version: ' + FW);
  doc.moveDown();
  doc.font('Times-Roman').text('WBU SN: ' + SN);
  doc.moveDown();
  let date = new Date();
  doc.font('Times-Roman').text('Test Date: ' + date.toLocaleString());
  doc.moveDown();
  for(let msgs in data){
    if(msgs == "Self Test Result"){
      if(data[msgs] === 15){
        doc.font('Times-Roman').text(msgs + ": Pass");
      }
      else{
        doc.font('Times-Roman').text(msgs + ": Fail");
        doc.moveDown();
        for(let test in data[msgs]){
          doc.font('Times-Roman').text("  "+msgs);
          doc.moveDown();
        }
      }
    }
    else{
      doc.font('Times-Roman').text(msgs + ': ' + data[msgs]);
    }
    doc.moveDown();
  }
  let month = date.getMonth() + 1;
  if(month < 10) month = '0' + month.toString();
  let day = date.getDate();
  let year = date.getFullYear();
  let hour = date.getHours();
  let minute = date.getMinutes();
  let second = date.getSeconds();
  let dateStr = day.toString() + month + year.toString() + '_' + hour + minute + second;
  let adrStr = pth + '/' + Test + '_' + SN + '_' + dateStr +'.pdf'
  const writeStream = fs.createWriteStream(adrStr);
  doc.pipe(writeStream);
  doc.end();
}

function createDataDump(data,sn){
  const fstrm = fs.createWriteStream(pth +"\\"+sn+'.dat');
  fstrm.write(data.slice(1));
  fstrm.end();
}

export {createReport, createDataDump} 
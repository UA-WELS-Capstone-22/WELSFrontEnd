// a pop up window which stores the file path selected by the user
const remote = require('@electron/remote');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { dialog } = remote;
import * as utils from './utils.js';

// const { saveAs } = require('file-saver');

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

// works for now should update
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

// function createReport(Test,SN,data){
//   // more todo but waiting for data
//   const doc = new PDFDocument();
//   doc.fontSize(25).text('Hello World!', 100, 100);
//   // stores current date and time in MMDDYYYY_HHMMSS format
//   let date = new Date();
//   let month = date.getMonth() + 1;
//   if(month < 10) month = '0' + month.toString();
//   let day = date.getDate();
//   let year = date.getFullYear();
//   let hour = date.getHours();
//   let minute = date.getMinutes();
//   let second = date.getSeconds();
//   let dateStr = day.toString() + month + year.toString() + '_' + hour + minute + second;

//   let adrStr = pth + '/' + Test + '_' + SN + '_' + dateStr +'.pdf'
//   const writeStream = fs.createWriteStream(adrStr);
//   doc.pipe(writeStream);
//   writeStream.write("WBU Test Report")
//   writeStream.write("WBU SN: " + SN)
//   writeStream.write("Test Date: " + date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds())
//   // writeStream.write("Test Type: " + data["test"])
//   // writeStream.write("Test results: " + data["result"])
//   for(let msgs in data){
//     writeStream.write(msgs + ": " + data[msgs])
//   }
//   doc.end();
// }

function createReport(Test,SN,data){
  const doc = new PDFDocument();
  doc.fontSize(25).text('WBU Test Report', 100, 100);
  doc.moveDown();
  doc.text('WBU SN: ' + SN);
  let date = new Date();
  doc.text('Test Date: ' + date.toLocaleString());
  doc.moveDown();
  for(let msgs in data){
    doc.text(msgs + ': ' + data[msgs]);
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


// this works to save file, 
// var file = new File([outDir], "test.txt", {type: "text/plain;charset=utf-8"});
// saveAs(file);


export {createReport, createDataDump} 
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

function createReport(){
  // more todo but waiting for data
  const doc = new PDFDocument();
  doc.fontSize(25).text('Hello World!', 100, 100);
  const writeStream = fs.createWriteStream(pth + '/test.pdf');
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
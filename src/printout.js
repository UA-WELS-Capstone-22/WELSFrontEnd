// a pop up window which stores the file path selected by the user
const remote = require('@electron/remote');
const { dialog } = remote;
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
setFileDir = document.getElementById('fileSelect');
updateDir = document.getElementById('changeDir');
dirLabel = document.getElementById('curDir');
var pth = ''

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
setFileDir.addEventListener('click', openFile);
updateDir.addEventListener('click', openFile);



// this works to save file, 
// var file = new File([outDir], "test.txt", {type: "text/plain;charset=utf-8"});
// saveAs(file);



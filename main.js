const {app, BrowserWindow} = require('electron');

googledrive = require('./googledrive.js')
googledrive.upload("/Users/masui/Desktop/kanribo.zip")

console.log("aaaaa")

// fsのrequireは動くのだが...
const fs = require('fs');
fs.writeFileSync("/tmp/log",process.argv[0])

//process.exit(0)

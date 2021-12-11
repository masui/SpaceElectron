
const {app, BrowserWindow} = require('electron');

const googledrive = require('./googledrive.js')
const fs = require('fs');

//
// 指定されたファイルをアップロードするメインルーチン
//
async function process(file){  
    var googleurl = await googledrive.upload(file)
    console.log(`upload end googleurl = #{googleurl}`)

    await fs.writeFileSync("/tmp/log",process.argv[0])
    console.log("log written")
}

/*
console.log("** list of argv[]")
if(process.argv[0]){
    console.log('- ' + process.argv[0])
    fs.writeFileSync("/tmp/argv0",process.argv[0])
}
if(process.argv[1]){
    console.log('- ' + process.argv[1])
    fs.writeFileSync("/tmp/argv1",process.argv[1])
}
if(process.argv[2]){
    console.log('- ' + process.argv[2])
    fs.writeFileSync("/tmp/argv2",process.argv[2])
}
*/

//
// アプリのアイコンにファイルがDrag&Dropされたときの処理
// Info.plistは修正しておく必要がある
//
app.on('will-finish-launching', () => {
    app.on('open-file', (event, filePath) => {
	event.preventDefault();

	process(filePath)
    });
});





const {app, BrowserWindow} = require('electron');

const googledrive = require('./googledrive.js')
const gyazo = require('./gyazo.js')
const thumbnail = require('./thumbnail.js')
const fs = require('fs');

//
// 指定されたファイルをアップロードするメインルーチン
//
async function do_space(file){  
    var google_url = await googledrive.upload(file)
    console.log(`google_url = #{google_url}`)
    
	
    thumbnail.thumbnail(file,"/tmp/thumbnail.png")
    
    // async function upload_gyazo(imagefile,title,desc,t){
    
    var date = new Date()
    var t = date.getTime() / 1000 // Unix time
    var gyazo_url = await gyazo.upload("/tmp/thumbnail.png",'SpaceApp',file,t)
    console.log(`gyazo_url = #{gyazo_url}`)

    /*
    console.log("** list of argv[]")
    if(process && process.argv){
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
    }
    */

    app.exit(0)
}


//
// アプリのアイコンにファイルがDrag&Dropされたときの処理
// Info.plistは修正しておく必要がある
//
// https://taku-o.hatenablog.jp/entry/20181024/1540380159
//
app.on('will-finish-launching', () => {
    app.on('open-file', (event, filePath) => {
	event.preventDefault();
	do_space(filePath)
    });
});



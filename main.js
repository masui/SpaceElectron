//
// 「空間」アプリ
//
// Space.appという名前だが 自分のプロジェクト名.app に変更して利用する
// このときプロジェクト名の「-」は「_」にする
// e.g. masui-space ⇒masui_space.app
//

const {app, dialog, BrowserWindow} = require('electron');

const googledrive = require('./googledrive.js')
const gyazo = require('./gyazo.js')
const thumbnail = require('./thumbnail.js')
const s3 = require('./s3.js')

const fs = require('fs');
const open = require('open');
const { execSync } = require('child_process')
const crypto = require('crypto')
const path = require('path');
const date_utils = require('date-utils');

var drag_drop = false

fs.writeFileSync("/tmp/log",process.argv[0] + "\n")

var project = process.argv[0].match(/\/(\w+)\.app\//)[1].replace(/_/g,'-')

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function start(){
    // 0.3秒待ってdrag_dropがfalseのままだったら単体起動と判定する
    await sleep(300)
    if(drag_drop == false){ // 単体起動
	open(`https://Scrapbox.io/${project}`)
	app.exit(0)
    }
}

if(process.argv[1]){ // コマンドラインから引数つきで呼び出されたとき
    space(process.argv[1])
}
else {
    start()
}

//
// 指定されたファイルをアップロードするメインルーチン
//
async function space(file){
    var s3bucket = null
    var data_upload_url

    const space_config_path = process.env['HOME'] + '/.space'
    if(fs.existsSync(space_config_path)){
	const buff = fs.readFileSync(space_config_path, "utf8");
        const space_config_data = JSON.parse(buff)
	if(space_config_data){
            s3bucket = space_config_data['s3-bucket']
	}
    }

    if(s3bucket){ // ファイルをS3にセーブ
	data_upload_url = s3.upload(file,s3bucket)
    }
    else { // ファイルをGoogleDriveにセーブ
	data_upload_url = await googledrive.upload(file)
    }

    //
    // ファイルのサムネイルをGyazoにアップロード
    //
    thumbnail.thumbnail(file,"/tmp/thumbnail.png")
    var date = new Date()
    var t = date.getTime() / 1000 // Unix time
    var gyazo_url = await gyazo.upload("/tmp/thumbnail.png",'SpaceApp',file,t)
    console.log(`gyazo_url = ${gyazo_url}`)

    //
    // Scrapboxページ作成
    //
    attr = {}
    attr['filename'] = file
    attr['fullname'] = path.resolve(file)
    attr['basename'] = path.basename(file)
    attr['uploadurl'] = data_upload_url
    attr['gyazourl'] = gyazo_url

    const md5 = crypto.createHash('md5')
    let text = fs.readFileSync(file);
    attr['md5'] = md5.update(text,'binary').digest('hex')

    const stats = fs.statSync(file);
    attr['time'] = stats.mtime
    attr['size'] = stats.size
    
    str = ''
    str += `[${attr['fullname']} ${attr['uploadurl']}]\n`
    str += `File: [${attr['basename']}]\n`
    str += `Size: ${attr['size']}\n`
    str += `[[${attr['gyazourl']}]]\n`
    
    let now = new Date();
    var datestr = now.toFormat('YYYYMMDDHHMISS');
    var title = encodeURIComponent(`${attr['basename']} ${datestr}`)
    var encoded = encodeURIComponent(str)

    // Scrapboxページを開く
    cmd = `https://Scrapbox.io/${project}/${title}?body=${encoded}`
    console.log(`https://Scrapbox.io/${project}/${title}?body=${encoded}`)
    open(cmd)

    // ファイルをゴミ箱に移動
    var trashscript = `
tell application "Finder"
  move POSIX file "${attr['fullname']}" to trash
end tell`
    execSync(`/usr/bin/osascript -e '${trashscript}'`)

    app.exit(0)
}

//
// アプリのアイコンにファイルがDrag&Dropされたときの処理
// Info.plistは修正しておく必要がある
// (droppable.rbで変換)
//
// https://taku-o.hatenablog.jp/entry/20181024/1540380159
//
app.on('will-finish-launching', () => {
    app.on('open-file', (event, filePath) => {
	event.preventDefault();
	drag_drop = true
	space(filePath)
    });
});

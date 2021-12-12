//
// Google認証してGoogleDriveにファイルをアップロードする
// 同期的に動かせるように苦しいことをしている
//
const http = require('http');
const querystring = require('querystring');
const open = require('open');
const url = require('url');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types')
const fetch = require('fetch');
const gyazo = require('gyazo');

// アプリのパスを取得
// Electronの場合とnodeから起動の場合で場所が違う
var apppath = process.argv[0]
if(apppath.match(/\/node$/)){
    apppath = process.argv[1]
}
const appdir = path.dirname(apppath)
const gyazo_token_path = appdir + '/gyazo_token' // gyazo token保存場所

function gyazo_token(){
    if(fs.existsSync(gyazo_token_path)){
	const buff = fs.readFileSync(gyazo_token_path, "utf8");
	return buff.trim()
    }
    else{
	return null
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// コールバックを受け取るためにlocalhostのサーバ立てる
async function run_local_server_and_get_token(){
    var token = null

    gyazo_client_id = "USECCHCZuVIN3DykF7Ixvy_wR93NqoUWlcMkQK2EoYM"     // Space.app用のID
    gyazo_client_secret = "7qcQynnsvWh_AZ78Lp-ZCvPkADG48ZH6jHsKcBpM0t0"
    gyazo_callback_url = "http://localhost/"
    auth_url = "https://gyazo.com/oauth/authorize?client_id=${gyazo_client_id}&redirect_uri=${gyazo_callback_url}&response_type=code"

    const server = http.createServer(async (req, res) => {
	if (req.url.indexOf('code') > -1) {
	    // acquire the code from the querystring, and close the web server.
	    const qs = querystring.parse(url.parse(req.url).query);
	    code = qs.code
	    res.end('Authentication successful! Please return to the console.');
	    server.close();
	    
	    token = get_gyazo_token_and_save(code)
	    return token;
	}
    }).listen(80, () => {
	open(auth_url)
    });
    
    // tokenに値が入るまで待つ... 異常に苦しいやり方なのだが
    while(true){
	await sleep(1000)
	if(token){
	    return token
	}
    }
}

async function get_gyazo_token_and_save(code){
    let res = await oauth2Client.getToken(code)
    var refresh_token = res.tokens.refresh_token
    
    try {
	fs.writeFileSync(google_refresh_token_path,refresh_token + "\n")
    } catch(e){
	console.log(e);
    }
    return refresh_token;
}

async function get_gyazo_token(){
    var token = gyazo_token() // セーブされてるトークンを得る
    if(! token){ // refresh tokenをまだ取得できていない
	token = await run_local_server_and_get_token();
    }
    return token;
}

async function upload_gyazo(file){
    var gyazo_token = await get_gyazo_token()
    console.log(`gyazo_token = ${gyazo_token}`)

    var url = await upload_gyazo_with_token(file,gyazo_token)
    console.log(`url = ${url}`)
    
    await fs.writeFileSync("/tmp/logurl",url)

    return url
}

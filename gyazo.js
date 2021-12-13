//
// 認証してGyazoに画像をアップロード
// 同期的に動かせるように苦しいことをしている
//
const http = require('http');
const querystring = require('querystring');
const open = require('open');
const url = require('url');
const path = require('path');
const fs = require('fs');

//var request = require('request')
var request = require('request-promise-native') // Promis版らしい

const Gyazo = require('gyazo-api');

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

const gyazo_client_id = "USECCHCZuVIN3DykF7Ixvy_wR93NqoUWlcMkQK2EoYM"     // Space.app用のID
const gyazo_client_secret = "7qcQynnsvWh_AZ78Lp-ZCvPkADG48ZH6jHsKcBpM0t0"
const gyazo_callback_url = "http://localhost/"

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// コールバックを受け取るためにlocalhostのサーバ立てる
async function run_local_server_and_get_token(){
    console.log('run_local_server_and_get_token()')
    var token = null

    auth_url = `https://gyazo.com/oauth/authorize?client_id=${gyazo_client_id}&redirect_uri=${gyazo_callback_url}&response_type=code`
    console.log(`auth_url = ${auth_url}`)

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
    // Gyazo認証API: https://gyazo.com/api/docs/auth
    console.log(`get_gyazo_token_and_save(${code})`)
    var options = {
	url: 'https://gyazo.com/oauth/token',
	method: 'POST',
	form: {
	    'code': code,
	    'client_id': gyazo_client_id,
	    'client_secret': gyazo_client_secret,
	    'redirect_uri': gyazo_callback_url,
	    'grant_type': 'authorization_code'
	}
    }

    var res = await request(options)
    var gyazo_token = JSON.parse(res).access_token

    try {
	fs.writeFileSync(gyazo_token_path,gyazo_token + "\n")
    } catch(e){
	console.log(e);
    }
    return gyazo_token
}

async function get_gyazo_token(){
    var token = gyazo_token() // セーブされてるトークンを得る
    if(! token){ // Gyazo tokenをまだ取得できていない
	token = await run_local_server_and_get_token();
    }
    return token;
}

async function upload_gyazo(imagefile,title,desc,t){
    var gyazo_token = await get_gyazo_token()
    var gyazo = new Gyazo(gyazo_token);
    var res = await gyazo.upload(imagefile,{
	title: title, // Fromに出る文字列
	desc: desc,   // 大きく表示される説明分
	created_at: t // Unix time
    })
    return res.data.permalink_url
}

// テスト
if(__filename == apppath){
    (async () => {
	var date = new Date()
	var t = date.getTime() / 1000 // Unix time
	var url = await upload_gyazo('/Applications/Emacs.app/Contents/Resources/etc/images/splash.png','Emacs app','Emacs Logo',t)
	console.log(url)
	
	process.exit(0)
    })()
}

exports.upload = upload_gyazo

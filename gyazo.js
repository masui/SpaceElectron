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
//const mime = require('mime-types')
//const fetch = require('node-fetch');
// import axios from 'axios';

//var request = require('request')
var request = require('request-promise-native')

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

//const FormData = require("form-data");

async function get_gyazo_token_and_save(code){
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
    console.log("Request()")

    /*
    request(options,function (error,response,body) {
	console.log('===========')
        console.log(JSON.parse(response.body));
    })
    */

    var res = await request(options)
    console.log(JSON.parse(res).access_token)
    var gyazo_token = JSON.parse(res).access_token

    /*
    let res = await oauth2Client.getToken(code)
    var refresh_token = res.tokens.refresh_token
    */
    /*
    const formData = new FormData();
    formData.append('code',code)
    formData.append('client_id',gyazo_client_id)
    formData.append('client_secret',gyazo_client_secret)
    formData.append('redirect_uri',gyazo_callback_url)
    formData.append('grant_type','authorization_code')
    // 送信用データを設定
    const options = {
	method: 'POST',
	body: formData,
	headers: {
	    'Content-Type': 'multipart/form-data',
	},
    };

    // ここで明示的に消してあげる
    delete options.headers['Content-Type'];
    //console.log(options)

    // 設定したデータをPOST
    var res = await fetch("https://gyazo.com/oauth/token", options);
    console.log(res)
    */

    try {
	fs.writeFileSync(gyazo_token_path,gyazo_token + "\n")
    } catch(e){
	console.log(e);
    }
    return gyazo_token

    /*
    #
    # Gyazoのアクセストークンを取得
    #
    uri = URI.parse("https://gyazo.com/oauth/token")
    req = Net::HTTP::Post.new(uri)
    req.set_form_data({
                        'code' => gyazo_auth_code,
                        'client_id' => gyazo_client_id,
                        'client_secret' => gyazo_client_secret,
                        'redirect_uri' => gyazo_callback_url,
                        'grant_type' => 'authorization_code'
                      })
    req_options = {
      use_ssl: true
    }
    response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
      http.request(req)
    end
    puts "response.body = #{response.body}"
    set_gyazo_token JSON.parse(response.body)['access_token'] # responseはJSONで返る
    dialog("Gyazoアクセストークンが生成されました。","OK",2)
    log "gyazo_token = #{gyazo_token}"
    */
}

async function get_gyazo_token(){
    var token = gyazo_token() // セーブされてるトークンを得る
    if(! token){ // refresh tokenをまだ取得できていない
	token = await run_local_server_and_get_token();
    }
    console.log(`get_gyazo_token: token=${token}`)
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

// テスト
if(__filename == apppath){
    (async () => {
	await get_gyazo_token()
	process.exit(0)
    })()
}

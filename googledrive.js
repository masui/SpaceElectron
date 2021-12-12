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
const { google } = require('googleapis');

// アプリのパスを取得
// Electronの場合とnodeから起動の場合で場所が違う
var apppath = process.argv[0]
if(apppath.match(/\/node$/)){
    apppath = process.argv[1]
}
const appdir = path.dirname(apppath)
const google_refresh_token_path = appdir + '/google_refresh_token' // refresh token保存場所

function google_refresh_token(){
    if(fs.existsSync(google_refresh_token_path)){
	const buff = fs.readFileSync(google_refresh_token_path, "utf8");
	return buff.trim()
    }
    else{
	return null
    }
}

//
// Spaceアプリの認証情報
//
const google_client_id = "245084284632-v88q7r65ddine8aa94qp7ribop4018eg.apps.googleusercontent.com"
const google_client_secret = "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"
const oauth2Client = new google.auth.OAuth2(
    google_client_id,
    google_client_secret,
    "http://localhost/"
);

const scopes = [
    'https://www.googleapis.com/auth/drive'
];

const auth_url = oauth2Client.generateAuthUrl({
    access_type: 'offline',  // onlineがデフォルトだがofflineにするとrefresh tokenを取得できる
    scope: scopes
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// コールバックを受け取るためにlocalhostのサーバ立てる
async function run_local_server_and_get_token(){
    var token = null
    const server = http.createServer(async (req, res) => {
	if (req.url.indexOf('code') > -1) {
	    // acquire the code from the querystring, and close the web server.
	    const qs = querystring.parse(url.parse(req.url).query);
	    code = qs.code
	    res.end('Authentication successful! Please return to the console.');
	    server.close();
	    
	    token = get_refresh_token_and_save(code)
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

async function get_refresh_token_and_save(code){
    let res = await oauth2Client.getToken(code)
    var refresh_token = res.tokens.refresh_token
    
    try {
	fs.writeFileSync(google_refresh_token_path,refresh_token + "\n")
    } catch(e){
	console.log(e);
    }
    return refresh_token;
}

async function get_google_refresh_token(){
    var token = google_refresh_token() // セーブされてるトークンを得る
    if(! token){ // refresh tokenをまだ取得できていない
	token = await run_local_server_and_get_token();
    }
    return token;
}

async function upload_googledrive_with_token(file,google_refresh_token){
    console.log(`upload: token=${google_refresh_token}`)

    oauth2Client.setCredentials({
	refresh_token: google_refresh_token
    });

    let res = await oauth2Client.refreshAccessToken()
    var drive = google.drive({ version: 'v3', auth: oauth2Client });
    var res2 = await drive.files.list({
	q: "name = 'Space' and mimeType = 'application/vnd.google-apps.folder' and parents in 'root'"
    })

    if(res2.data.files.length <= 0){ // Spaceフォルダが存在しない場合
	const fileMetadata = {
	    'name': 'Space', //作成したいフォルダの名前
	    'mimeType': 'application/vnd.google-apps.folder'
	};
	const params = {
	    resource: fileMetadata,
	    fields: 'id'
	}
	try {
	    let res = await drive.files.create(params);
	    console.log("folder created")
	    console.log(res.data);
	    folderId = res.data.id
	} catch (error) {
	    console.log(error);
	}
    }
    else {
	// Spaceという名前のフォルダを探してIDを取得する
	folderId = res2.data.files[0].id
    }
    console.log(`folderId = ${folderId}`)

    const filename = path.basename(file)
    
    const params = {
	resource: {
	    name: filename,
	    parents: [folderId]
	},
	media: {
	    mimeType: mime.lookup(file),
	    body: fs.createReadStream(file)
	},
	fields: 'id'
    };
    
    let res3 = await drive.files.create(params);

    return `https://drive.google.com/open?id=${res3.data.id}`
}

async function upload_googledrive(file){
    var google_refresh_token = await get_google_refresh_token()
    console.log(`google_refresh_token = ${google_refresh_token}`)

    var url = await upload_googledrive_with_token(file,google_refresh_token)
    console.log(`url = ${url}`)
    
    await fs.writeFileSync("/tmp/logurl",url)

    return url
}

// テスト
if(__filename == apppath){
    (async () => {
	var tmpfilepath = "/tmp/tmp.txt"
	fs.writeFileSync(tmpfilepath,"abcdefg\n")
	var url = await upload_googledrive(tmpfilepath)
	console.log(`URL = ${url}`)
	process.exit(0)
    })()
}

exports.upload = upload_googledrive

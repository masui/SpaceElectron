//
// このバージョンはupload_googledrive()が終了した後で実際に認証が
// 行なわれるので同期処理が難しい。
// もっと同期的に動くものに変更する。
//
// fetchの使いかた
// https://developer.mozilla.org/ja/docs/Web/API/Fetch_API/Using_Fetch
//
// open
// https://www.npmjs.com/package/opn
//
// asyncが全然無意味な気がする...
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

// アプリのパスを取得したいが、Electronの場合とnodeから起動の場合で場所が違う
apppath = process.argv[0]
if(apppath.match(/\/node$/)){
    apppath = process.argv[1]
}
const appdir = path.dirname(apppath)

const google_refresh_token_path = appdir + '/google_refresh_token'
var google_refresh_token = null

const client_id = "245084284632-v88q7r65ddine8aa94qp7ribop4018eg.apps.googleusercontent.com"
const client_secret = "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"

async function upload_googledrive(file){
    var url
    if(fs.existsSync(google_refresh_token_path)){
	const buff = fs.readFileSync(google_refresh_token_path, "utf8");
	google_refresh_token = buff.trim()
	
	url = await upload_googledrive_with_token(file,google_refresh_token)
	console.log("upload_googledrive_with_token() call end")
    }
    else{
	url = await get_google_refresh_token_and_upload(file)
	console.log("get_google_refresh_token_and_upload() call  end")
    }
    console.log("upload_googledrive end")

    return url
}

async function upload_googledrive_with_token(file,google_refresh_token){
    console.log(`upload: token=${google_refresh_token}`)

    var oauth2Client = new google.auth.OAuth2(client_id, client_secret, "http://localhost/");
    oauth2Client.setCredentials({
	refresh_token: google_refresh_token
    });

    var res1 = await oauth2Client.refreshAccessToken()
    var drive = google.drive({ version: 'v3', auth: oauth2Client });
    res2 = await drive.files.list({
	q: "name = 'Space' and mimeType = 'application/vnd.google-apps.folder' and parents in 'root'"
    })

    // console.log(res2.data)
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
	    const res = await drive.files.create(params);
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
    
    console.log("try to create a file")
    const res = await drive.files.create(params);
    console.log("upload real end-------")

    return `https://drive.google.com/open?id=${res.id}`
}
				    
const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    "http://localhost/"
);

// generate a url that asks permissions for Blogger and Google Calendar scopes
const scopes = [
  'https://www.googleapis.com/auth/drive'
];

const auth_url = oauth2Client.generateAuthUrl({
  // 'online' (default) or 'offline' (gets refresh_token)
  access_type: 'offline',

  // If you only need one scope you can pass it as a string
  scope: scopes
});

console.log(auth_url)

async function get_google_refresh_token_and_upload(file){
    var code = ''
    
    console.log(`get_google_refresh_token_and_upload(${file})`)
	
    // コールバックを受け取るためにlocalhostのサーバ立てる
    const server = http.createServer(async (req, res) => {
	console.log(req.url)
	if (req.url.indexOf('code') > -1) {
	    // acquire the code from the querystring, and close the web server.
	    const qs = querystring.parse(url.parse(req.url).query);
	    console.log(`Code is ${qs.code}`);
	    code = qs.code
	    res.end('Authentication successful! Please return to the console.');
	    server.close();
	    
	    var token = await run(code)
	    console.log(`token = ${token}`)
	}
    }).listen(80, () => {
	open(auth_url)
    });

    function run(code){
	console.log(`run code=${code}`)

	oauth2Client.getToken(code, function(err, tokens) {
	    console.log('トークンが発行されました');
	    console.log(tokens);
	    console.log('上記の情報を大切に保管してください');
	    
	    try {
		fs.writeFileSync(google_refresh_token_path,tokens.refresh_token + "\n")
		console.log('write end');
		google_refresh_token = tokens.refresh_token
		console.log(`google_refresh_token === ${google_refresh_token}`)
	    }catch(e){
		console.log(e);
	    }
	    
	    upload_googledrive_with_token(file,google_refresh_token)
	});
    }
}

// テスト
if(__filename == apppath){
    (async () => {
	var tmpfilepath = "/tmp/tmp.txt"
	fs.writeFileSync(tmpfilepath,"abcdefg\n")
	var url = await upload_googledrive(tmpfilepath)
	console.log(`URL = ${url}`)
	// process.exit(0)
    })()
}

exports.upload = upload_googledrive

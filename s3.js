//
//
//
const crypto = require('crypto')
const fs = require('fs');
const { execSync } = require('child_process')

function upload_s3(file,bucket){
    var ext = ''
    var a = file.match(/^(.*)(\.\w+)$/)
    if(a){
	ext = a[2]
    }

    const md5 = crypto.createHash('md5')
    let text = fs.readFileSync(file);
    var hash = md5.update(text,'binary').digest('hex')

    // aws cp コマンドを使う
    // 認証情報は ~/.aws/ にある
    // ファイル名が日本語だとうまくいかないことがあるので別ファイルにコピーしてからアップロード
    var content_type = ''
    if(ext.match(/^\.pdf$/i)){
	content_type = "--content-type application/pdf "
    }
    if(ext.match(/^\.txt$/i)){
	content_type = "--content-type text/plain "
    }
    var dstfile = `s3://${bucket}/${hash[0]}/${hash[1]}/${hash}${ext}`

    execSync(`/bin/cp '${file}' /tmp/__space_file`)
    execSync(`/usr/local/bin/aws s3 cp --profile default /tmp/__space_file ${dstfile} ${content_type} --acl public-read `)
    execSync('/bin/rm /tmp/__space_file')
    
    return `https://s3-ap-northeast-1.amazonaws.com/${bucket}/${hash[0]}/${hash[1]}/${hash}${ext}`
}


// テスト
var apppath = process.argv[0]
if(apppath.match(/\/node$/)){
    apppath = process.argv[1]
}
if(__filename == apppath){
    (() => {
	var tmpfilepath = "/tmp/tmp.txt"
	fs.writeFileSync(tmpfilepath,"abcdefghij\n")
	var url = upload_s3(tmpfilepath,"masui.org")
	console.log(`URL = ${url}`)
	process.exit(0)
    })()
}

exports.upload = upload_s3

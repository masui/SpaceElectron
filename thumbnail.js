//
// qlmanageでサムネイルを作成
//
const fs = require('fs');
const path = require('path')
const { execSync } = require('child_process')

function thumbnail(file,thumbnailfile){ // fileのサムネイルをthumbnailfileとして作成
    if(!fs.existsSync(file)){
	return null
    }
    
    var qlcmd = `/usr/bin/qlmanage -t '${file}' -s 1024 -x -o /tmp`
    console.log(qlcmd)
    var pngpath = `/tmp/${path.basename(file)}.png`
    console.log(pngpath)
    execSync(qlcmd)

    if(fs.existsSync(pngpath)){
	console.log("qlmanageでサムネ作成成功")
    }
    else {
	console.log("qlmanageでサムネ作成失敗")
	var tmphtml = "/tmp/thumbnail.html"
	fs.writeFileSync(tmphtml,thumbnail_html(file))
	qlcmd = `qlmanage -t ${tmphtml} -s 512 -x -o /tmp`
	execSync(qlcmd)
	pngpath = "/tmp/thumbnail.html.png"
    }

    if(fs.existsSync(pngpath)){
	execSync(`/bin/cp ${pngpath} ${thumbnailfile}`)
	execSync(`/bin/rm -f ${pngpath}`)
    }
    else {
	console.log(`${pngpath}作成失敗`)
	process.exit(0)
    }
}

function thumbnail_html(file){
    const name = path.basename(file)
    const stats = fs.statSync(file);
    const size = stats.size;
    const time = stats.mtime;
    const html = `
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>${name}</title>
    <style type="text/css">
      body {
	  background-color: #eee;
	  margin: 10pt;
	  font-size:40pt;
	  font-family: "Helvetica Neue", Helvetica, Arial,
		       Verdana, Roboto, "游ゴシック", "Yu Gothic",
		       "游ゴシック体", "YuGothic", "ヒラギノ角ゴ Pro W3",
		       "Hiragino Kaku Gothic Pro", "Meiryo UI", "メイリオ",
		       Meiryo, "ＭＳ Ｐゴシック", "MS PGothic", sans-serif;
      }
    </style>
  </head>
  <body>
    file: <b>${name}</b><br>
    size: ${size}<br>
    date: ${time}<br>
  </body>
</html>
`
    return html
}

// テスト
var apppath = process.argv[0]
if(apppath.match(/\/node$/)){
    apppath = process.argv[1]
}
if(__filename == apppath){
    thumbnail("./thumbnail.js","/tmp/junk.png")
}

exports.thumbnail = thumbnail

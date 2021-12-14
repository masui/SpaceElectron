const { execSync } = require('child_process')

const electron = require('electron');

/* appがreadyの後じゃないと駄目といって怒られる
function dialog(message, button, timeout=3){
    var options = {
        type: 'info',
        buttons: ['OK', 'テスト', 'Cancel', 'sample', 'Yes', 'No'],
        title: 'タイトル',
        message: 'メッセージ',
        detail: '詳細メッセージ'
    };
    electron.dialog.showMessageBoxSync(options);
}
*/

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function dialog(message, button, timeout=3){
    // electron.dialog.showErrorBox(message, button)

    options = {
	type: 'info',  // none/info/error/quetion/warning
	title: 'Alert',
	// message: "",
	detail: message
    }
    while(true){
	await sleep(300)
	if(electron.app.isReady()){
	    break
	}
    }
    electron.dialog.showMessageBoxSync(options);
}

/*
function dialog(message, button, timeout=3){
    var buttons = '';
    var a = []
    if(Array.isArray(button)){
	button.forEach(s => a.push('"'+s+'"'))
	buttons = a.join(', ')
    }
    else {
	buttons = '"'+button+'"'
    }
    var script = `display dialog "${message}" buttons { ${buttons} } giving up after ${timeout}`
    var res = execSync(`/usr/bin/osascript -e '${script}'`)
    return res.toString()
}
*/

exports.dialog = dialog

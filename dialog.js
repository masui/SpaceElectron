const { execSync } = require('child_process')

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

exports.dialog = dialog

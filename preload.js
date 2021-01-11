String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    console.log(sec_num);
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);
    var millis = (parseFloat(this) - sec_num).toFixed(2).substr(2);

    if (hours < 10) { hours = "0" + hours; }
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }
    return hours + ':' + minutes + ':' + seconds + ':' + millis;
}

window.addEventListener('DOMContentLoaded', () => {
    // renderer process
    var ipcRenderer = require('electron').ipcRenderer;
    ipcRenderer.on('timecodeVars', function (event, timecodeVars) {
        console.log(timecodeVars.currentCountDown);
        updateScreen(timecodeVars.currentProgressPrecent, timecodeVars.currentCountDown);

        if (timecodeVars.currentCountDown < 0.1) {
            setTimeout(function () {
                updateScreen(0, "0");
            }, 200);
        }
    })
    reloadSettings();

    document.getElementById('save').addEventListener('click', () => {
        console.log("clicked");
        saveInputs();
    });
})


function updateScreen(progressPercent, countDownSeconds) {
    document.querySelector('.progressbar').style.width = progressPercent + '%';
    document.querySelector('.time-clip').innerText = countDownSeconds.toHHMMSS();
}


function reloadSettings() {
    var settings = getSettings();
    Object.keys(settings['CasparCG']).forEach(function(key) {
        document.getElementById(key).value = settings['CasparCG'][key].toString();
    });
}

function getSettings() {
    var ipcRenderer = require('electron').ipcRenderer;
    return ipcRenderer.sendSync('get-settings', '');
}

function saveInputs() {
    var settings = getSettings();
    Object.keys(settings['CasparCG']).forEach((key) => {
        settings['CasparCG'][key] = document.getElementById(key).value;
    });
    var ipcRenderer = require('electron').ipcRenderer;
    var value = ipcRenderer.sendSync('save-settings', settings);
    if (value === true) {
        document.getElementById('message').innerText = "Gespeichert";
        setTimeout(() => {
            document.getElementById('message').innerText = "";
        }, 2000);
    }
}
String.prototype.toHHMMSS = function (with_millis = false) {
    var sec_num = parseInt(this, 10);
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);
    if (with_millis)
        var millis = (parseFloat(this) - sec_num).toFixed(2).substr(2);

    if (hours < 10) { hours = "0" + hours; }
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }
    return hours + ':' + minutes + ':' + seconds + (with_millis ? ':' + millis : '');
}

var show_starttime = null;
var show_timeinterval = null;

window.addEventListener('DOMContentLoaded', () => {
    // renderer process
    var ipcRenderer = require('electron').ipcRenderer;
    registerTimecodeHandler(ipcRenderer);
    registerApiCallbacks(ipcRenderer);
    registerMessageHandler(ipcRenderer);
    ipcRenderer.on('update-settings', () => {
        reloadSettings();
    });

    reloadSettings();

    document.getElementById('save').addEventListener('click', () => {
        saveInputs();
    });
});

function updateScreen(progressPercent, countDownSeconds) {
    document.querySelector('.progressbar').style.width = progressPercent + '%';
    document.querySelector('.time-clip').innerText = countDownSeconds.toHHMMSS(true);
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

function registerApiCallbacks(ipcRenderer) {
    ipcRenderer.on('show-start', () => {
        // Can't start if already started
        if (show_timeinterval != null) return;

        show_starttime = Date.now();
        show_timeinterval = setInterval(() => {
            updateShowTime();
        }, 100);
    });
    ipcRenderer.on('show-stop', () => {
        if (show_timeinterval != null) {
            clearInterval(show_timeinterval);
            show_starttime = null;
            show_timeinterval = null;
        }
    });
    ipcRenderer.on('show-reset', () => {
        document.querySelector('.time-show').innerText = '00:00:00';
    });
}

function updateShowTime() {
    elapsedTime = (Date.now() - show_starttime) / 1000;
    document.querySelector('.time-show').innerText = elapsedTime.toString().toHHMMSS();
}

function registerTimecodeHandler(ipcRenderer) {
    ipcRenderer.on('timecodeVars', function (event, timecodeVars) {
        console.log(timecodeVars.currentCountDown);
        updateScreen(timecodeVars.currentProgressPrecent, timecodeVars.currentCountDown);

        if (timecodeVars.currentCountDown < 0.1) {
            setTimeout(function () {
                updateScreen(0, "0");
            }, 200);
        }
    })
}

function registerMessageHandler(ipcRenderer) {
    ipcRenderer.on('show-message', function (event, msg) {
        showMessage(msg.message);
    })
}

function showMessage(message) {
    var el = document.querySelector('#message-display');
    el.innerText = message;
    el.style.display = 'block';
    setTimeout(function() {
        el.style.display = 'none';
        el.innerText = '';
    }, 4000);
}
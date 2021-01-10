const { app, BrowserWindow } = require('electron')
const path = require('path')
const { autoUpdater } = require("electron-updater")
const CCGServer = require('./CCGServer');
const isDev = process.env.APP_DEV ? (process.env.APP_DEV.trim() == "true") : false;


// GLOBAL SETTINGS
var globalSettings = {
    CasparCG: {
        server: "192.168.1.141",
        port_AMCP: 5250,
        port_OSC: 6250,
        ccgChannel: 1,
        ccgLayer_video_01: 10,
    }
};
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true
        }
    })

    mainWindow.loadFile('index.html')

}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    if (!isDev) autoUpdater.checkForUpdates()

    var server = new CCGServer(globalSettings);
    server.start((timecodeVars) => {
        console.log(timecodeVars);
    });
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})
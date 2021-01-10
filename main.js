const { app, BrowserWindow } = require('electron')
const path = require('path')
const { autoUpdater } = require("electron-updater")

var CCGServer = require('./CCGServer');

// GLOBAL SETTINGS
var globalSettings = {
    CasparCG: {
        server: "localhost",
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
            preload: path.join(__dirname, 'preload.js')
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

    autoUpdater.checkForUpdates()

    var server = new CCGServer(globalSettings);
    server.start();
    console.log("SERVER STARTED");
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})
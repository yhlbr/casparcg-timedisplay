const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron')
const path = require('path')
const { autoUpdater } = require("electron-updater")
const Store = require('electron-store');
const store = new Store();
const CCGServer = require('./CCGServer');
const WebServer = require('./WebServer');
const isDev = process.env.APP_DEV ? (process.env.APP_DEV.trim() == "true") : false;

var mainWindow = null;
var server = null;

// GLOBAL SETTINGS
var settings = {
    CasparCG: {
        server: store.get("server") || 'localhost',
        port_AMCP: store.get("ports.AMCP") || 5250,
        port_OSC: store.get("ports.OSC") || 6250,
        ccgChannel: store.get("ccg.channel") || 1,
        ccgLayer: store.get("ccg.layer") || 10,
    }
};

ipcMain.on('get-settings', (event) => {
    event.returnValue = settings;
});
ipcMain.on('save-settings', (event, arg) => {
    updateSettings(arg);
    event.returnValue = true;
});

function updateSettings(newSettings) {
    settings = newSettings;
    if (server) {
        server.stop();
        server.config = settings;
        server.start();
    }
    Object.keys(settings['CasparCG']).forEach((key) => {
        switch (key) {
            case 'server':
                store.set('server', settings['CasparCG']['server']);
                break;
            case 'port_AMCP':
                store.set('ports.AMCP', settings['CasparCG']['port_AMCP']);
                break;
            case 'port_OSC':
                store.set('ports.OSC', settings['CasparCG']['port_OSC']);
                break;
            case 'ccgChannel':
                store.set('ccg.channel', settings['CasparCG']['ccgChannel']);
                break;
            case 'ccgLayer':
                store.set('ccg.layer', settings['CasparCG']['ccgLayer']);
                break;
        }
    });

    mainWindow.send('update-settings');
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true
        },
        fullscreen: !isDev,
        icon: __dirname + "img/icon.ico",
        title: "CasparCG Time Display"
    })
    if (!isDev) mainWindow.setMenuBarVisibility(false)

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

    server = new CCGServer(settings);
    server.start((timecodeVars) => {
        if (mainWindow) {
            mainWindow.send('timecodeVars', timecodeVars);
        }
    });

    const webServer = new WebServer();
    mainWindow.webContents.on('did-finish-load', () => {
        webServer.start((success) => {
            if (!success) {
                mainWindow.send('show-message', {
                    message: 'WebServer konnte nicht gestartet werden.'
                });
            }
        });
        webServer.registerIpc(mainWindow);
        webServer.registerSettingsFunction(() => { return settings; });
        webServer.registerNewSettingsCallback((newSettings) => {
            updateSettings(newSettings);
        });
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})
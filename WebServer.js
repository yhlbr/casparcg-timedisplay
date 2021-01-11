module.exports = class WebServer {
    app = null;
    ipc = null;
    getSettingsFunction = null;
    newSettingsCallback = null;

    start(callback) {
        if (this.app !== null) {
            callback(true);
            return;
        }

        const port = 3000;
        const express = require('express');
        const bodyParser = require('body-parser');
        var app = express();
        this.app = app;
        app.use(bodyParser.urlencoded({extended: true}));
        app.use(express.static('http'));
        app.listen(port).on('error', (err) => {
            console.log('Port ' + port + ' is already in use!');
            callback(false);
        });
        this.registerApiCalls();
        this.registerSaveCall();
        callback(true);
    }

    stop() {
        this.app.close();
        this.app = null;
    }

    reset() {
        this.stop();
        this.ipc = null;
        this.getSettingsFunction = null;
        this.newSettingsCallback = null;
    }

    registerApiCalls() {
        this.app.get('/api/show/start', (req, res) => {
            this.fireIpcEvent('show-start', res);
        });
        this.app.get('/api/show/stop', (req, res) => {
            this.fireIpcEvent('show-stop', res);
        });
        this.app.get('/api/show/reset', (req, res) => {
            this.fireIpcEvent('show-reset', res);
        });

        this.app.get('/api/settings', (req, res) => {
            res.send(JSON.stringify(this.getSettings()));
        });
    }

    registerIpc(ipc) {
        this.ipc = ipc;
    }

    registerSettingsFunction(func) {
        this.getSettingsFunction = func;
    }

    registerNewSettingsCallback(func) {
        this.newSettingsCallback = func;
    }

    fireIpcEvent(eventName, res) {
        if (!this.ipc || typeof this.ipc.send != 'function') {
            res.status(500).send('Unable to fire Event');
            return;
        }
        this.ipc.send(eventName);
        res.send('OK');
    }

    getSettings() {
        if (typeof this.getSettingsFunction == 'function')
            return this.getSettingsFunction();
        else
            return {};
    }

    registerSaveCall() {
        this.app.post('/settings/save', (req, res) => {
            // Save new settings
            var newSettings = { CasparCG: req.body };
            if (typeof this.newSettingsCallback == 'function') {
                this.newSettingsCallback(newSettings);
            }

            res.redirect(301, '/?success=true');
        });
    }
}
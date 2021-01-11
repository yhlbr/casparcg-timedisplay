module.exports = class WebServer {
    app = null;
    ipc = null;
    getSettingsFunction = null;
    newSettingsCallback = null;

    start() {
        const express = require('express');
        const bodyParser = require('body-parser');
        var app = this.app = express();
        const port = 3000
        app.use(bodyParser.urlencoded());
        app.use(express.static('http'));
        app.listen(port);
        this.registerApiCalls();
        this.registerSaveCall();
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
            var newSettings = {CasparCG: req.body};
            if (typeof this.newSettingsCallback == 'function') {
                this.newSettingsCallback(newSettings);
            }

            res.redirect(301, '/?success=true');
        });
    }
}
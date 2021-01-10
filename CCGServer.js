
// CasparCG Connection
const { CasparCG } = require("casparcg-connection");

// OSC
const osc = require('osc');

module.exports = class CCGServer {
    // SAVED CONNECTIONS
    CasparCG_Connection = null;
    osc = null;
    callbackFunction = null;

    // VARIABLES
    timecodeVars = {
        videoPresent: false,
        currentTime: 0,
        currentTimeConverted: '00:00:00:00',
        currentDuration: 0,
        currentDurationConverted: '00:00:00:00',
        currentCountDown: 0,
        currentCountDownConverted: 0,
        currentProgressPrecent: 0
    }

    msPerFrame = 40; // PAL 25 FPS
    config = {};

    constructor(config) {
        this.config = config;
    }

    start(callbackFn = null) {
        if (callbackFn) {
            this.callbackFunction = callbackFn;
        }
        // Start CCG Connector
        this.ccgConnector((err) => {
            if (!err) {
                this.ccgConnectOSC();
            }
        });
    }

    // CCG CONNECTOR
    ccgConnector(callback) {

        // CASPARCG SETUP NEW CONNECTION
        if (this.CasparCG_Connection == null) {
            this.CasparCG_Connection = new CasparCG({
                host: this.config.CasparCG.server,
                port: this.config.CasparCG.port_AMCP,
                autoConnect: false,
                onError: function (err) {
                    console.log(err);
                },
                onConnectionChanged: function (ccgConnectionChanged) {
                    if (ccgConnectionChanged === true) {
                        callback();
                    }
                    if (ccgConnectionChanged === false) {
                        callback('disconnected');
                        CasparCG_Connection = null;
                    }
                }
            });

            // CASPARCG SETUP CONNECT
            this.CasparCG_Connection.connect();
        }
    }

    // OSC Client
    ccgConnectOSC() {
        // Create an osc.js UDP Port listening on port 57121.
        var server = this.osc = new osc.UDPPort({
            localAddress: "0.0.0.0",
            localPort: this.config.CasparCG.port_OSC,
            metadata: true
        });

        // Listen for incoming OSC messages.
        server.on("message", (oscMsg) => {
            this.handleOscMessage(oscMsg);
        });

        // Open the socket.
        server.open();
    }

    handleOscMessage(oscMsg) {
        if (oscMsg.address == '/channel/' + this.config.CasparCG.ccgChannel + '/stage/layer/' + this.config.CasparCG.ccgLayer_video_01 + '/file/time') {
            var currentTime = Number(oscMsg.args[0].value.toFixed(3));
            var currentDuration = Number(oscMsg.args[1].value.toFixed(3));

            // CHECK IF TIME HAS CHANGED
            if (currentTime != this.timecodeVars.currentTime || currentDuration != this.timecodeVars.currentDuration) {
                this.calculateTime(currentTime, currentDuration);
            }
        }
    }

    // Calculate Multiple Timings
    calculateTime(currentTime, currentDuration) {

        // Raw Time
        this.timecodeVars.currentTime = currentTime;
        this.timecodeVars.currentDuration = currentDuration;

        // Time To TC
        this.timecodeVars.currentTimeConverted = this.msToTime(currentTime * 1000);
        this.timecodeVars.currentDurationConverted = this.msToTime(currentDuration * 1000);

        // Calculate Countdown
        this.timecodeVars.currentCountDown = currentDuration - currentTime;
        this.timecodeVars.currentCountDown = this.timecodeVars.currentCountDown.toFixed(3);
        this.timecodeVars.currentCountDownConverted = this.msToTime(this.timecodeVars.currentCountDown * 1000);

        // Calculate Progress
        this.timecodeVars.currentProgressPrecent = ((currentTime / currentDuration) * 100).toFixed(1);
        if (typeof this.callbackFunction == 'function')
            this.callbackFunction(this.timecodeVars);
    }

    // MS to TC converter
    msToTime(duration) {
        var frames = parseInt((duration % 1000) / this.msPerFrame)
            , seconds = parseInt((duration / 1000) % 60)
            , minutes = parseInt((duration / (1000 * 60)) % 60)
            , hours = parseInt((duration / (1000 * 60 * 60)) % 24);
        frames = (frames < 10) ? "0" + frames : frames;
        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;

        return hours + ":" + minutes + ":" + seconds + ":" + frames;
    }

    // DATE TIME NOW
    dateTimeNow() {
        var MyDate = new Date();
        var MyDateString;
        MyDate.setDate(MyDate.getDate());
        MyDateString = MyDate.getFullYear() + '-' + ('0' + (MyDate.getMonth() + 1)).slice(-2) + '-' + (' 0' + MyDate.getDate()).slice(-2) + ' ' + (' 0' + MyDate.getHours()).slice(-2) + ':' + (' 0' + MyDate.getMinutes()).slice(-2) + ':' + (' 0' + MyDate.getSeconds()).slice(-2);
        return MyDateString;
    }

    // DATE NOW
    dateNow() {
        var MyDate = new Date();
        var MyDateString;
        MyDate.setDate(MyDate.getDate());
        MyDateString = MyDate.getFullYear() + '-' + ('0' + (MyDate.getMonth() + 1)).slice(-2) + '-' + (' 0' + MyDate.getDate()).slice(-2);
        return MyDateString;
    }
}

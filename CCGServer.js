
// CasparCG Connection
const { CasparCG } = require("casparcg-connection");

// OSC
const oscClient = require('osc-min');
const udpConnection = require("dgram");

module.exports = class CCGServer {
    // SAVED CONNECTIONS
    CasparCG_Connection = null;

    // VARIABLES
    timecodeVars = {
        videoPresent: null,
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

    start() {
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
        var oscSocket = udpConnection.createSocket("udp4", function (msg, info) {
            var error, error1;
            try {

                // CASPARCG - GET OSC
                oscMessages = oscClient.fromBuffer(msg);
                oscMessages.elements.forEach(function (oscMessage) {

                    // CHECK IF VIDEO PRODUCER IS PRESENT
                    if (oscMessage.address == '/channel/' + this.config.CasparCG.ccgChannel + '/stage/layer/' + this.config.CasparCG.ccgLayer_video_01 + '/foreground/producer') {
                        var videoPresent = false;
                        if (oscMessage.args[0].value != 'empty') {
                            videoPresent = true;
                        }
                        else {
                            videoPresent = false;
                        }

                        // CHECK IF VIDEO STATUS HAS CHANGED
                        if (videoPresent != timecodeVars.videoPresent) {
                            timecodeVars.videoPresent = videoPresent;
                        }
                    }

                    // GET TIMING
                    if (oscMessage.address == '/channel/' + this.config.CasparCG.ccgChannel + '/stage/layer/' + this.config.CasparCG.ccgLayer_video_01 + '/foreground/file/time') {
                        var currentTime = Number(oscMessage.args[0].value.toFixed(3));
                        var currentDuration = Number(oscMessage.args[1].value.toFixed(3));

                        // CHECK IF TIME HAS CHANGED
                        if (currentTime != timecodeVars.currentTime || currentDuration != timecodeVars.currentDuration) {
                            this.calculateTime(currentTime, currentDuration);
                        }
                    }
                });

                // CASPARCG - CATCH ERROR
            } catch (error1) {
                error = error1;
            }
        });

        // SOCKET.IO - BIND CONNECTION
        oscSocket.bind(this.config.CasparCG.port_OSC);
    }

    // Calculate Multiple Timings
    calculateTime(currentTime, currentDuration) {

        // Raw Time
        timecodeVars.currentTime = currentTime;
        timecodeVars.currentDuration = currentDuration;

        // Time To TC
        timecodeVars.currentTimeConverted = msToTime(currentTime * 1000);
        timecodeVars.currentDurationConverted = msToTime(currentDuration * 1000);

        // Calculate Countdown
        timecodeVars.currentCountDown = currentDuration - currentTime;
        timecodeVars.currentCountDown = timecodeVars.currentCountDown.toFixed(3);
        timecodeVars.currentCountDownConverted = msToTime(timecodeVars.currentCountDown * 1000);

        // Calculate Progress
        timecodeVars.currentProgressPrecent = ((currentTime / currentDuration) * 100).toFixed(1);
        console.log(timecodeVars);
    }

    // MS to TC converter
    msToTime(duration) {
        var frames = parseInt((duration % 1000) / msPerFrame)
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

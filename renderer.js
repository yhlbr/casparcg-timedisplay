// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

function $(el) {
    return document.querySelector(el);
}
setInterval(() => {
    var curDate = new Date();
    var curTime = curDate.toLocaleTimeString();
    $('.time.time-now').innerText = curTime;
}, 300);

$('.settings').addEventListener('click', () => {
    $('.settings-container').style.display = $('.settings-container').style.display == 'block' ? 'none' : 'block';
});
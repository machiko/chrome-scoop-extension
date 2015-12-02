/* Regex-pattern to check URLs against.
   It matches URLs like: http[s]://[...]stackoverflow.com[...] */
// var urlRegex = /^https?:\/\/(?:[^\.]+\.)?stackoverflow\.com/;

/* A function creator for callbacks */
function doStuffWithDOM(domContent) {
    console.log(JSON.parse(domContent));
    // var target = "https://reyes.me/api/curl?callback=?";
    // $.ajax({
    // url: target,
    // data: {
    //     url: "http://www.google.com"
    // },
    // jsonpCallback: "callback",
    // dataType: "jsonp",
    // success: function(data) {
    //     alert(data);
    //     console.log(data);
    // }
    // });
}

/* When the browser-action button is clicked... */
chrome.browserAction.onClicked.addListener(function(tab) {
    /*...check the URL of the active tab against our pattern and... */
    // if (urlRegex.test(tab.url)) {
    //     /* ...if it matches, send a message specifying a callback too */
    //     chrome.tabs.sendMessage(tab.id, { text: "report_back" },
    //                             doStuffWithDOM);
    // }
    chrome.tabs.sendMessage(tab.id, { text: "report_back" },
                                doStuffWithDOM);
});

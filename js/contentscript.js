// Content script
/* Listen for messages */
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    /* If the received message has the expected format... */
    if (msg.text && (msg.text == "report_back")) {
        /* Call the specified callback, passing
           the web-pages DOM content as argument */

        var title = $(document).find('html').children("body").find("#mediaarticlehead .headline").text();
        var author = $(document).find('html').children("body").find("#mediaarticlehead .fn").text();
        var org = $(document).find('html').children("body").find("#mediaarticlehead .provider.org").text();
        var content = $(document).find('html').children("body").find("#mediaarticlebody").text();
        // sendResponse(document.all[0].outerHTML);
        // sendResponse($(document).find('html').children("body").find("#mediaarticlebody").text());
        var news_json = {
        	"title": title,
        	"author": author,
        	"org": org,
        	"content": content
        }
        console.log(news_json);
        // sendResponse($(document).find('html').children("body").find("#mediaarticlebody").text());
        sendResponse(JSON.stringify(news_json));
  //       var str = "aa<b>1;2'3</b>hh<b>aaa</b>..\n.<b>bbb</b>\nblabla..";

		// var match = "";
		// var result = "";
		// var regex = /<b>(.*?)<\/b>/ig;
		// while (match = regex.exec(str)) { result += match[1]; }

    }
});

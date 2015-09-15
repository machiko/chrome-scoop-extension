// Content script
var gapi_key = "AIzaSyBBnkRPORCp9RujLhF4kEjkYCXOsa72mgI";
var gcse_cx = "001325834152955743717:jmzdtntzo60";

/* Listen for messages */
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    /* If the received message has the expected format... */
    if (msg.text && (msg.text == "report_back")) {
        /* Call the specified callback, passing
           the web-pages DOM content as argument */
        // $.notify("擷取網頁內容中...", "success");
        var title = $(document).find('html').children("body").find("#mediaarticlehead .headline").text();
        var author = $(document).find('html').children("body").find("#mediaarticlehead .fn").text();
        var org = $(document).find('html').children("body").find("#mediaarticlehead .provider.org").text();
        var content = $(document).find('html').children("body").find("#mediaarticlebody3").text();
        // sendResponse(document.all[0].outerHTML);
        // sendResponse($(document).find('html').children("body").find("#mediaarticlebody").text());
        var news_json = {
            "title": title,
            "author": author,
            "org": org,
            "content": content,
            "link": window.location.href
        }

        $.notify("進行 ckip 標題分詞",
        {
          globalPosition: 'bottom right',
          className: "success"
        });
        // step1. 針對 title 進行 ckip 處理
        $.post('https://localhost:8443/Scoop/api/ckip', {
            content: news_json.title,
        }, function(result) {
            for (var i = result.word.length - 1; i >= 0; i--) {
                if (result.speech[i] == "PAUSECATEGORY") {
                    result.word.splice(i, 1);
                }
            }
            var ckip_search = result.word.join(" ");
            $.notify("標題分詞結果 : " + ckip_search,
            {
              clickToHide: true,
              autoHide: false,
              globalPosition: 'bottom right',
              className: "info"
            });
            console.log(ckip_search);

            // step2. 使用 google custom search
            $.get('https://www.googleapis.com/customsearch/v1', {
                key: gapi_key,
                cx: gcse_cx,
                q: ckip_search
            }, function(result) {
                $.notify("使用 google custom search 搜尋",
                {
                  globalPosition: 'bottom right',
                  className: "success"
                });
                var result_len = result.items.length
                for (var i = 0; i < result_len; i++) {
                    var match_str = news_json.link;
                    // console.log(news_json.link);
                    // console.log(result.items[i].link);
                    // 去除重複的網址
                    console.log(result.items[i].link);
                    if (match_str.match(result.items[i].link)) {
                        result.items.splice(i, 1);
                    }
                }
                // console.log(result.items);
            }, 'json');

        }, 'json');

        // console.log(news_json);
        // sendResponse($(document).find('html').children("body").find("#mediaarticlebody").text());
        sendResponse(JSON.stringify(news_json));
        //       var str = "aa<b>1;2'3</b>hh<b>aaa</b>..\n.<b>bbb</b>\nblabla..";

        // var match = "";
        // var result = "";
        // var regex = /<b>(.*?)<\/b>/ig;
        // while (match = regex.exec(str)) { result += match[1]; }

    }
});

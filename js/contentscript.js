// Content script
var gapi_key = "AIzaSyBBnkRPORCp9RujLhF4kEjkYCXOsa72mgI";
var gcse_cx = "001325834152955743717:jmzdtntzo60";

var show_noty = function(type, text, timeout, callback) {
    var n = noty({
        text        : text,
        type        : type,
        dismissQueue: true,
        layout      : 'bottomRight',
        closeWith   : ["click"],
        theme       : 'relax',
        animation   : {
            open  : 'animated fadeIn',
            close : 'animated fadeOutUp',
            easing: 'swing',
            speed : 500
        },
        timeout: timeout,
        callback: callback,
    });

    // n.setTimeout(3000);
    // console.log('html: ' + n.options.id);
};

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

        show_noty('warning', '進行 ckip 標題分詞', 2000, {
          afterClose: function() {
            // ------ step1. 針對 title 進行 ckip 處理 ------//
            $.post('https://localhost:8443/Scoop/api/ckip', {
                content: news_json.title,
            }, function(result) {
            	console.log(result);
                for (var i = result.word.length - 1; i >= 0; i--) {
                	// 過濾標點符號
                	var filter_sign_arr = ['PAUSECATEGORY', 'EXCLAMATIONCATEGORY', 'PARENTHESISCATEGORY'];
                    if (filter_sign_arr.indexOf(result.speech[i]) != -1) {
                        result.word.splice(i, 1);
                        result.speech.splice(i, 1);
                    }
                }

                var ckip_search = result.word.join(" ");

                // show_noty('success', '標題分詞結果 : 「' + ckip_search + '」', false);
                show_noty('success', '標題分詞結果 : 「' + ckip_search + '」', false,
                {
                  afterShow: function() {
                    // 顯示分詞結果之後, 進行 step2.
                    show_noty('warning', '使用 google custom search 搜尋斷詞關鍵字', 3000, {
                      afterClose: function() {
                        // ------ step2. 使用 google custom search ------//
                        $.get('https://www.googleapis.com/customsearch/v1', {
                            key: gapi_key,
                            cx: gcse_cx,
                            q: ckip_search
                        }, function(result) {
                        	console.log(result);
                            var result_len = result.items.length
                            var gcse_url_arr = [];

                            for (var i = 0; i < result_len; i++) {
                                var match_str = news_json.link;
                                // console.log(news_json.link);
                                // console.log(result.items[i].link);
                                // 去除重複的網址之後，針對網址進行 curl
                                if (!match_str.match(result.items[i].link)) {
                                    // result.items.splice(i, 1);
                                    gcse_url_arr.push((i + 1) + "=>" + result.items[i].link);
                                }
                                // console.log(result.items[i].link);
                            }

                            // console.log(gcse_url_arr.join('<br/>'));
                            // ------ step3. 針對網址進行 curl ------//
                            show_noty('success', 'google 前十筆網址 : <br/>' + gcse_url_arr.join('<br/>'), false,
                            {
                              afterShow: function() {
                                show_noty('warning', '進行 curl 內容擷取', 3000);
                                for (var i = 0; i < gcse_url_arr.length; i++)
                                {
                                  var filter_url = gcse_url_arr[i].split('=>')[1];
                                  console.log(filter_url);
                                  $.get('https://reyes.me/api/curl', {
                                    url: filter_url
                                  }, function(result) {
                                    console.log(result);
                                  });
                                }
                              }
                            });

                            // console.log(result.items);
                        }, 'json');

                      }
                    });

                  }
                });
                console.log(ckip_search);
            }, 'json');

          }
        });


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

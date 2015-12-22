// Content script
var gapi_key = "AIzaSyBBnkRPORCp9RujLhF4kEjkYCXOsa72mgI";
var gcse_cx = "001325834152955743717:jmzdtntzo60";
var domain = "https://reyes.me/";
var target = "https://reyes.me/api/curl";
var threshold = 0.129;

var show_noty = function(type, text, timeout, callback) {
    var n = noty({
        text        : text,
        type        : type,
        dismissQueue: true,
        maxVisible : 10,
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
    return n;
};

// 小數四捨五入
var formatFloat = function(num, pos) {
  var size = Math.pow(10, pos);
  return Math.round(num * size) / size;
};

// alert(formatFloat("1109.1893", 2));


/* Listen for messages */
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    /* If the received message has the expected format... */
    if (msg.text && (msg.text == "report_back")) {
        /* Call the specified callback, passing
           the web-pages DOM content as argument */
        // $.notify("擷取網頁內容中...", "success");
        // var title = $(document).find('html').children("body").find("#mediaarticlehead .headline").text();
        // var author = $(document).find('html').children("body").find("#mediaarticlehead .fn").text();
        // var org = $(document).find('html').children("body").find("#mediaarticlehead .provider.org").text();
        // var content = $(document).find('html').children("body").find("#mediaarticlebody").text();
        var news_json = {};
        var main_id;

        $.getJSON(target + '?url[]=' + window.location.origin + encodeURIComponent(window.location.pathname + window.location.search), function(msg) {
            console.log(msg);
            main_id = msg.id[0];
            news_json = {
                "title": msg.title[0],
                // "author": author,
                // "org": org,
                "content": msg.content[0],
                "link": window.location.href
            };

            // console.log(news_json);
            show_noty('warning', '進行 ckip 標題分詞', 2000, {
              afterClose: function() {
                // ------ step1. 針對 title 進行 ckip 處理 start ------//
                $.post('https://localhost:8443/Scoop/api/ckip', {
                    content: news_json.title,
                }, function(result) {
                    // console.log(result.word.length);
                    // 如果回傳陣列長度為0, 表示目前 ckip 服務暫停中
                    if (result.word.length == 0) {
                        show_noty('error', '目前 CKIP 服務暫停中', false);
                        return false;
                    }
                    // console.log(result);
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
                    show_noty('success', '標題分詞結果 : 「' + ckip_search + '」', false, {
                      afterShow: function() {
                        // 顯示分詞結果之後, 進行 step2.
                        show_noty('warning', '使用 google custom search 搜尋斷詞關鍵字', 3000, {
                            afterClose: function() {
                                // ------ step2. 使用 google custom search start ------//
                                $.get('https://www.googleapis.com/customsearch/v1', {
                                    key: gapi_key,
                                    cx: gcse_cx,
                                    q: ckip_search
                                }, function(result) {
                                	// console.log(result);
                                    if (!result.items) {
                                        show_noty('warning', 'google 無結果', false);
                                        return;
                                    }
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

                                    // 顯示 gce 前十筆網址之後，進行 curl
                                    show_noty('success', 'google 前十筆網址 : <br/>' + gcse_url_arr.join('<br/>'), false, {
                                        afterShow: function() {
                                            var $curl_msg = show_noty('warning', '進行 curl 內容擷取', false);
                                            // console.log($curl_msg);
                                            var query_str = '';
                                            var query_symbol = '?';

                                            for (var i = 0; i < gcse_url_arr.length; i++) {
                                                var filter_url = gcse_url_arr[i].split('=>')[1];

                                                if (i != 0) {
                                                    query_symbol = '&';
                                                }

                                                query_str += query_symbol + 'url[]=' + filter_url;
                                            }

                                            // console.log(target + query_str);
                                            //------ step3. 針對網址進行 curl start ------//
                                            $.getJSON(target + query_str, function(msg) {
                                                // console.log(133, msg);
                                                $curl_msg.close();
                                                show_noty('warning', '進行 Cosine Similar 比對', false, {
                                                    afterShow: function() {
                                                        $.noty.clearQueue();
                                                        //----- step4. 針對回傳的結果進行 cosine similar algorithm 相似性比對 start -----/
                                                        var cosine_similar_arr = [];
                                                        for (var i = 0; i < msg.content.length; i++) {
                                                            // console.log(msg.id[i], msg.url[i]);
                                                            $.ajax({
                                                                url: 'https://localhost:8443/Scoop/api/csa',
                                                                type: 'POST',
                                                                async: false,
                                                                data: {
                                                                    origin_content: news_json.content,
                                                                    compare_content: msg.content[i],
                                                                    url: msg.url[i],
                                                                    ids: main_id + ',' + msg.id[i]
                                                                },
                                                                dataType: 'json',
                                                                success: function(result) {
                                                                    show_noty('information', '與「<a href="'+result.url+'" target="_blank">' + result.url + '</a>」比對後的餘弦值 : ' + result.cosine, false);
                                                                    var compare_obj = {};
                                                                    compare_obj.url = result.url;
                                                                    compare_obj.cosine = formatFloat(result.cosine, 2);
                                                                    cosine_similar_arr.push(compare_obj);
                                                                    // console.log(result.ids);
                                                                    // console.log(float_digits);

                                                                    // 將餘弦值寫入資料庫
                                                                    $.post('https://reyes.me/api/add_news_similar', {
                                                                        'value': result.cosine,
                                                                        'url_ids': result.ids
                                                                    });
                                                                },
                                                                error: function(err) {
                                                                    // console.log(err);
                                                                }
                                                            });
                                                            // $.post('https://localhost:8443/Scoop/api/csa', {
                                                            //     origin_content: news_json.content,
                                                            //     compare_content: msg.content[i],
                                                            //     url: msg.url[i],
                                                            //     ids: main_id + ',' + msg.id[i]
                                                            // }, function(result) {
                                                            //     show_noty('information', '與「<a href="'+result.url+'" target="_blank">' + result.url + '</a>」比對後的餘弦值 : ' + result.cosine, false);
                                                            //     var float_digits = formatFloat(result.cosine, 2);
                                                            //     cosine_similar_arr.push(float_digits);
                                                            //     console.log(result.ids);
                                                            //     // console.log(float_digits);

                                                            //     // 將餘弦值寫入資料庫
                                                            //     $.post('https://reyes.me/api/add_news_similar', {
                                                            //         'value': result.cosine,
                                                            //         'url_ids': result.ids
                                                            //     });
                                                            // }, 'json');
                                                        }

                                                        console.log(cosine_similar_arr);
                                                        for (var i = 0; i < cosine_similar_arr.length; i++) {
                                                            if (cosine_similar_arr[i].cosine > threshold) {
                                                                // 顯示為非獨家
                                                                show_noty('error', '非獨家新聞，與「<a href="'+cosine_similar_arr[i].url+'" target="_blank">相似', false);
                                                            }

                                                        }
                                                        //----- step4. 針對回傳的結果進行 cosine similar algorithm 相似性比對 end -----/
                                                    }
                                                });
                                            },'json');
                                            // ------ step3. 針對網址進行 curl end ------//

                                        }
                                    });
                                }, 'json');
                                // ------ step2. 使用 google custom search end ------//
                            }
                        });

                      }
                    });
                    // console.log(ckip_search);
                }, 'json');
                // ------ step1. 針對 title 進行 ckip 處理 end ------//
              }
            });
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

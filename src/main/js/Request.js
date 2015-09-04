var http = require('http');
var https = require('https');
var urlTools = require('url');
var Q = require("q");

var config = {
    http: {
        proxy: "http://proxy.le-figaro.com:8080/"
    }
}
config.http.proxy = null;

var buildParams = function(params) {
    if (typeof params === "string") {
        return params;
    }
    var result = "";
    for (var key in params) {
        result += key + "=" + params[key] + "&";
    }
    if (result.length > 0) {
        return result.substring(0, result.length - 1);
    } else {
        return "";
    }
}

var startsWith = function(string, start) {
    return string.length >= start.length && string.substring(0, start.length) === start;
}

module.exports = {
    call: function(options) {
        var defer = Q.defer();
        var url = options.url;
        var method = options.method;
        var getParams = options.getParams;
        var postParams = options.postParams;
        var headers = options.headers ? options.headers : {};

        var completeUrl = url;
        if (getParams) {
            var builtParams = buildParams(getParams);
            if (builtParams && builtParams.length > 0) {
                completeUrl += "?" + builtParams;
            }
        }
        var client = startsWith(url, "https") ? https : http;
        //console.log("calling " + method + " " + completeUrl);

        var request;
        var responseHandler = function(res) {
            if (res.statusCode >= 400) {
                console.log(method + " " + completeUrl+ " " + res.statusCode);
            }
            //res.setEncoding('utf8');
            res.body = "";
            res.on('data', function(data) {
                res.body += data;
            });
            res.on("end", function() {
                if (res.statusCode >= 400 || res.statusCode === 0) {
                    defer.reject({
                        options: options,
                        res: {
                            body: res.body,
                            statusCode: res.statusCode
                        }
                    });
                } else {
                    defer.resolve(res);
                }
            });
        }
        var errorHandler = function(e) {
           console.error("error while calling : "+method+" "+completeUrl);
           console.error(e);
           defer.reject(e);
        };
        try {
            var postData = postParams ? (postParams.length ? postParams : buildParams(postParams)) : "";
            var parsedUrl = urlTools.parse(completeUrl);
            headers["Content-Length"] = postData.length;
            if (!headers["User-Agent"]) {
                headers["User-Agent"] = "curl/7.35.0";
            }
            if (!headers["Content-Type"]) {
                headers["Content-Type"] = "application/x-www-form-urlencoded";
            }
            headers.Host = parsedUrl.host;
            var path = parsedUrl.path;
            var proxyUrl = config.http.proxy;
            if (proxyUrl) {
                parsedUrl = urlTools.parse(proxyUrl);
                path = completeUrl;
            }
            var splittedHost = parsedUrl.host.split(":");
            var host = splittedHost[0];
            var port = splittedHost.length === 2 ? splittedHost[1] : 80;
            var post_options = {
                host: host,
                port: port,
                path: path,
                method: method,
                headers: headers,
                withCredentials: options.withCredentials === false ? false : true
            };
            //console.log("calling", post_options, postData);
            request = client.request(post_options, responseHandler);
            request.on('error', errorHandler);
            if (method === "POST") {
                request.write(postData);
            }
            request.end();
        } catch(e) {
            errorHandler(e);
        }
        return defer.promise;
    },
    get: function(url, params) {
        return this.call({
            url: url,
            getParams: params,
            method: "GET"
        });
    },
    post: function(url, params) {
        return this.call({
          url: url,
          postParams: params,
          method: "POST"
        });
    },
    buildParams: buildParams
};
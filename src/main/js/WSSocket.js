var Q = require("./Q");
var Socket = require("./Socket");
var logger = require("./Logger");

var WSSocket = function(url) {
    var socket = new Socket();
    var connected = false;
    var defer = Q.defer();
    try {
        var webSocket = new WebSocket(url);
        webSocket.onopen = function() {
            connected = true;
            defer.resolve(socket);
        }
        webSocket.onclose = function() {
            socket.delete();
        }
        webSocket.onerror = function(err) {
            if (!connected) {
                defer.reject(err);
            } else {
                logger.error(err);
            }
        }
        webSocket.onmessage = function(event) {
            self.socket.inStream.publish(event.data);
        }
        socket.outStream.subscribe(function(message) {
            webSocket.send(message);
        })
    } catch(err) {
        defer.reject(err);
    }
    return defer.promise;
}

module.exports = WSSocket;

var Q = require("./Q");
var Request = require("rauricoste-request");
var logger = require("./Logger").getLogger("XhrSocket");
var Socket = require("./RealSocket");

var XhrSocket = function(receiver) {
    this.receiver = receiver;
}
var createRequest = function() {
    return new Request().withCredentials(false);
}

XhrSocket.prototype.connect = function(url) {
    var self = this;
    this.url = url;
    return createRequest().get(url).then(function(result) {
        logger.info("connected", result);
        var message = JSON.parse(result.body);
        if (message.id) {
            self.connected = true;
            self.id = message.id;
            setInterval(function() {
                self.poll();
            }, 1000);
        } else if (message.error) {
            throw new Error(message.error);
        }
    }).catch(function(err) {
        throw err;
    });
}
XhrSocket.prototype.close = function() {
    self.connnected = false;
    return createRequest().call({
        url: self.url+"/"+self.id,
        method: "DELETE",
        withCredentials: false
    }).then(function(result) {
        var body = result.body;
        var response = JSON.parse(body);
        if (response.error) {
            throw new Error(response.error);
        }
    }).catch(function(err) {
        logger.error("error", err);
    });
}
XhrSocket.prototype.send = function(message) {
    if (!this.connected) {
        throw new Error("not connected !");
    }
    var self = this;
    return createRequest().post(self.url+"/"+self.id, message+"").then(function(result) {
        var body = result.body;
        var response = JSON.parse(body);
        if (response.error) {
            throw new Error(response.error);
        }
    }).catch(function(err) {
        logger.error("error", err);
    });
}
XhrSocket.prototype.poll = function() {
    var self = this;
    return createRequest().get(self.url+"/"+self.id).then(function(result) {
        var body = result.body;
        var message = JSON.parse(body);
        if (message.newId) {
          logger.info("newId", self.id, message.newId);
          self.id = message.newId;
          return;
        }
        if (message.error) {
            throw new Error(message.error);
        }
        var messages = message.messages;
        for (var i=0;i<messages.length;i++) {
            var str = messages[i];
            self.receiver(str);
        }
    }).catch(function(err) {
        logger.error("error", err);
    });
}
module.exports = function(url) {
    var socket = new Socket();
    var xhrSocket = new XhrSocket(function(message) {
        socket.inStream.publish(message);
    })
    socket.outStream.subscribe(function(message) {
        return xhrSocket.send(message);
    })
    return xhrSocket.connect(url).then(function() {
        return socket;
    })
};

var Q = require("q");
var Request = require("./Request");
var IntervalCall = require("./IntervalCall");

var Socket = function(receiver) {
    this.receiver = receiver;
}
Socket.prototype.connect = function(url) {
    var self = this;
    this.url = url;
    return Request.call({
        url: url,
        method: "GET",
        withCredentials: false
    }).then(function(result) {
        console.log("connected", result);
        var message = JSON.parse(result.body);
        if (message.id) {
            self.connected = true;
            self.id = message.id;
            IntervalCall(1000, function() {
                self.poll();
            });
        } else if (message.error) {
            throw new Error(message.error);
        }
    }).catch(function(err) {
        throw err;
    });
}
Socket.prototype.close = function() {
    self.connnected = false;
    return Request.call({
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
        console.error("error", err);
    });
}
Socket.prototype.send = function(message) {
    if (!this.connected) {
        throw new Error("not connected !");
    }
    var self = this;
    return Request.call({
        url: self.url+"/"+self.id,
        method: "POST",
        withCredentials: false,
        postParams: message
    }).then(function(result) {
        var body = result.body;
        var response = JSON.parse(body);
        if (response.error) {
            throw new Error(response.error);
        }
    }).catch(function(err) {
        console.error("error", err);
    });
}
Socket.prototype.poll = function() {
    var self = this;
    return Request.call({
        url: self.url+"/"+self.id,
        method: "GET",
        withCredentials: false
    }).then(function(result) {
        var body = result.body;
        var message = JSON.parse(body);
        if (message.error) {
            throw new Error(message.error);
        }
        var messages = message.messages;
        for (var i=0;i<messages.length;i++) {
            var str = messages[i];
            self.receiver(str);
        }
    }).catch(function(err) {
        console.error("error", err);
    });
}
module.exports = Socket;

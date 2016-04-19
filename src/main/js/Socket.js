var Q = require("./Q");

var Socket = function(receiver) {
    this.receiver = receiver;
}
Socket.prototype.connect = function(url) {
    var self = this;
    self.connected = false;
    var defer = Q.defer();
    try {
        self.wrapped = new WebSocket(url);
    } catch(err) {
        defer.reject(err);
    }
    self.wrapped.onopen = function() {
        self.connected = true;
        defer.resolve();
    }
    self.wrapped.onclose = function() {
        self.connected = false;
    }
    self.wrapped.onerror = function(err) {
        if (!self.connected) {
            defer.reject(err);
        } else {
            console.error(err);
        }
    }
    self.wrapped.onmessage = function(event) {
        self.receiver(event.data);
    }
    return defer.promise;
}
Socket.prototype.close = function() {
    this.wrapped.close();
}
Socket.prototype.send = function(message) {
    if (!this.connected) {
        throw new Error("not connected !");
    }
    return this.wrapped.send(message);
}
module.exports = Socket;

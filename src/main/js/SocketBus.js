/* import Socket */ var Socket = require("./Socket");
var Q = require("q");

var SocketBus = function(url, onReceive) {
    this.onReceive = onReceive;
    var self = this;

    var defer = Q.defer();
    this.socket = new Socket(function(messageStr) {
        var message = JSON.parse(messageStr);
        if (message.server) {
            switch(message.server) {
                case "ID":
                    self.id = message.id;
                    console.log("SocketBus connected to "+url+" with id "+self.id);
                    defer.resolve();
                    break;
                case "ERROR":
                    console.error(message.originalMessage, message.error);
                    break;
                case "JOIN":
                    console.log("joined room "+message.room, message.members);
                    break;
                default:
                    console.warn("unknown command", message.server);
            }
            return;
        }
//        if (message.dest !== self.id) {
//            console.error("received a message with dest "+message.dest+". my id is "+self.id);
//            return;
//        }
        self.onReceive(message);
    });
    this.socket.connect(url);
    this.connectPromise = defer.promise;
}
SocketBus.prototype.sendObject = function(object) {
    var self = this;
    return self.connectPromise.then(function() {
        object.source = self.id;
        self.socket.send(JSON.stringify(object));
    });
}
SocketBus.prototype.send = function(dest, message) {
    this.sendObject({
        dest: dest,
        message: message
    });
}
SocketBus.prototype.sendCommand = function(command, args) {
    this.sendObject({
        server: command,
        args: args
    });
}
SocketBus.prototype.joinRoom = function(roomName) {
    this.sendCommand("JOIN", [roomName]);
}
SocketBus.prototype.sendRoom = function(roomName, message) {
    this.sendObject({
        room: roomName,
        message: message
    });
}
module.exports = SocketBus;

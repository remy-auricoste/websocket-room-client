/* import Socket */ var Socket = require("./Socket");
/* import XhrSocket */ var XhrSocket = require("./XhrSocket");
var Q = require("q");

var SocketBus = function(url, onReceive, onRoomChange) {
    // object compatibility
    if (typeof url === "object" && !onReceive && !onRoomChange) {
        onReceive = url.onReceive;
        onRoomChange = url.onRoomChange;
        url = url.url; // should be last !!!
    }

    this.onReceive = onReceive;
    this.onRoomChange = onRoomChange;
    var self = this;
    this.rooms = {};

    var defer = Q.defer();
    this.socket = new XhrSocket(function(messageStr) {
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
                    self.rooms[message.room] = message.members;
                    self.callRoomUpdate(message.room);
                    break;
                case "ROOM_JOIN":
                    var room = self.rooms[message.room];
                    room.push(message.id);
                    self.callRoomUpdate(message.room);
                    break;
                case "ROOM_LEAVE":
                    var room = self.rooms[message.room];
                    room.splice(room.indexOf(message.id), 1);
                    self.callRoomUpdate(message.room);
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

    window.onclose = function() {
        self.close();
    }
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
SocketBus.prototype.leaveRoom = function(roomName) {
    this.sendCommand("LEAVE", [roomName]);
}
SocketBus.prototype.sendRoom = function(roomName, message) {
    this.sendObject({
        room: roomName,
        message: message
    });
}
SocketBus.prototype.callRoomUpdate = function(roomName) {
    var self = this;
    if (this.onRoomChange && typeof this.onRoomChange === "function") {
        this.onRoomChange({
            room: roomName,
            members: self.rooms[roomName]
        });
    }
}
SocketBus.prototype.close = function() {
    this.socket.close();
}
module.exports = SocketBus;

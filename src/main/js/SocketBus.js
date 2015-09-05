/* import Socket */ var Socket = require("./Socket");
/* import XhrSocket */ var XhrSocket = require("./XhrSocket");
var Q = require("q");

var SocketBus = function(host, onReceive, onRoomChange) {
    // object compatibility
    if (typeof host === "object" && !onReceive && !onRoomChange) {
        onReceive = host.onReceive;
        onRoomChange = host.onRoomChange;
        host = host.host; // should be last !!!
    }
    if (!host || !host.length) {
        throw new Error("error in init : host="+host);
    }
    this.host = host;
    this.onReceive = onReceive;
    this.onRoomChange = onRoomChange;
    var self = this;
    this.rooms = {};

    var defer = Q.defer();
    var receiveFct = function(messageStr) {
        var message = JSON.parse(messageStr);
        if (message.server) {
            switch(message.server) {
                case "ID":
                    self.id = message.id;
                    console.log("SocketBus connected to "+self.host+" with id "+self.id);
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
        self.onReceive(message);
    };
    this.socket = new Socket(receiveFct);
    this.socket.connect("wss://"+self.host).catch(function(err) {
        console.error(err);
        self.socket = new XhrSocket(receiveFct);
        return self.socket.connect("http://"+self.host+"/socket");
    })
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

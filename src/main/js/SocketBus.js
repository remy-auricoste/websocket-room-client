/* import Socket */ var Socket = require('./Socket');
/* import SubSocket */ var SubSocket = require('./SubSocket');
/* import RoomSocket */ var RoomSocket = require('./RoomSocket');
/* import XhrSocket */ var XhrSocket = require('./XhrSocket');
var Q = require("./Q");
var Random = require("rauricoste-random");

var cron = function(interval, fonction) {
    setTimeout(function() {
        var result = fonction();
        if (result) {
            cron(interval, fonction);
        }
    }, interval);
}

var SocketBus = function(host, onReceive) {
    // object compatibility
    if (typeof host === "object" && !onReceive) {
        onReceive = host.onReceive;
        host = host.host; // should be last !!!
    }
    if (!host || !host.length) {
        throw new Error("error in init : host="+host);
    }
    if (typeof host === "string") {
        host = [host];
    }
    this.host = host;
    var self = this;
    this.rooms = {};
    this.listeners = {};
    this.roomListeners = {};
    this.addListener(onReceive);

    var defer = Q.defer();
    var receiveFct = function(messageStr) {
        var message = JSON.parse(messageStr);
        if (message.server) {
            switch(message.server) {
                case "ID":
                    self.id = message.id;
                    console.log("SocketBus connected to "+self.usedHost+" with id "+self.id);
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
        for (var key in self.listeners) {
            var listener = self.listeners[key];
            listener(message);
        }
    };
    Q.traverse(self.host, function(host) {
        var socketFactory = host.substring(0, 2) === "ws" ? Socket : XhrSocket;
        self.socket = new socketFactory(receiveFct);
        self.usedHost = host;
        return self.socket.connect(host).then(function() {
            throw "connected";
        }).catch(function(err) {
            if (err !== "connected") {
                // silence exceptions
                console.error(err);
            } else {
                throw err;
            }
        });
    }).catch(function(err) {
        if (err !== "connected") {
            throw err;
        }
    });
    this.connectPromise = defer.promise;
    this.connectPromise.then(function() {
        cron(40000, function() {
            self.sendCommand("PING");
            return self.connected;
        });
    });
}
SocketBus.prototype.sendObject = function(object) {
    var self = this;
    return self.connectPromise.then(function() {
        object.source = self.id;
        self.socket.send(JSON.stringify(object));
    });
}
SocketBus.prototype.send = function(dest, message) {
    return this.sendObject({
        dest: dest,
        message: message
    });
}
SocketBus.prototype.sendCommand = function(command, args) {
    return this.sendObject({
        server: command,
        args: args
    });
}
SocketBus.prototype.joinRoom = function(roomName) {
    return this.sendCommand("JOIN", [roomName]);
}
SocketBus.prototype.leaveRoom = function(roomName) {
    return this.sendCommand("LEAVE", [roomName]);
}
SocketBus.prototype.sendRoom = function(roomName, message) {
    return this.sendObject({
        room: roomName,
        message: message
    });
}
SocketBus.prototype.callRoomUpdate = function(roomName) {
    var self = this;
    var message = {
      room: roomName,
      members: self.rooms[roomName]
    };
    for (var key in self.roomListeners) {
        var listener = self.roomListeners[key];
        listener(message);
    }
}
SocketBus.prototype.close = function() {
    this.socket.close();
}

var findListenerId = function(listeners) {
    var id = Random.nextReadableId();
    var existingObj = listeners[id];
    return existingObj ? findListenerId(listeners) : id;
}

SocketBus.prototype.addListener = function(listener) {
    var self = this;
    if (typeof listener === "function") {
        var id = findListenerId(self.listeners);
        this.listeners[id] = listener;
        return {
            delete: function() {
                delete self.listeners[id];
            }
        }
    } else if (listener) {
        throw new Error("listener should be a function. received: "+typeof listener);
    }
}
SocketBus.prototype.addRoomListener = function(listener) {
    var self = this;
    if (typeof listener === "function") {
        var id = findListenerId(self.roomListeners);
        this.roomListeners[id] = listener;
        return {
            delete: function() {
                delete self.roomListeners[id];
            }
        }
    } else if (listener) {
        throw new Error("listener should be a function. received: "+typeof listener);
    }
}
SocketBus.prototype.subSocket = function(key) {
    return new SubSocket(this, key);
}
SocketBus.prototype.openRoom = function(roomName) {
    var self = this;
    self.joinRoom(roomName);
    return new RoomSocket(roomName, this);
}
SocketBus.prototype.getId = function() {
    return this.id;
}
module.exports = SocketBus;

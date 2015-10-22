/* import Socket */ var Socket = require('./Socket');
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
        self.socket = new Socket(receiveFct);
        self.usedHost = host;
        return self.socket.connect("ws://"+host).catch(function(err) {
            self.socket = new XhrSocket(receiveFct);
            return self.socket.connect("http://"+host+"/socket");
        }).then(function() {
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
SocketBus.prototype.subSocket = function(key, onReceive) {
    var self = this;
    var listener = this.addListener(function(messageObj) {
        if (messageObj.message[key]) {
            onReceive({
                source: messageObj.source,
                dest: messageObj.dest,
                room: messageObj.room,
                message: messageObj.message[key]
            });
        }
    });
    return {
        listener: listener,
        finalMessage: function(message) {
            var result = {};
            result[key] = message;
            return result;
        },
        send: function(dest, message) {
            return self.send(dest, this.finalMessage(message));
        },
        sendRoom: function(roomName, message) {
            return self.sendRoom(roomName, this.finalMessage(message));
        },
        joinRoom: function(roomName) {
          return self.joinRoom(roomName);
        },
        leaveRoom: function(roomName) {
          return self.leaveRoom(roomName);
        }
    }
}
SocketBus.prototype.openRoom = function(roomName) {
    var self = this;
    self.joinRoom(roomName);
    var result = {
        listeners: [],
        nicknames: {},
        send: function(message) {
            return self.sendRoom(roomName, message);
        },
        sendNickName: function(nickname) {
            this.send({__nickname: nickname});
        },
        getRoomUsers: function() {
            var self2 = this;
            if (!self.rooms[roomName]) {
              return [];
            }
            return self.rooms[roomName].map(function(userId) {
                var nickname = self2.nicknames[userId];
                return nickname ? nickname : userId;
            });
        },
        addListener: function(fonction) {
            var listener = self.addListener(function(messageObj) {
                if (messageObj.room && messageObj.room === roomName) {
                    fonction(messageObj);
                }
            });
            this.listeners.push(listener);
            return listener;
        },
        addRoomListener: function(fonction) {
            var listener = self.addRoomListener(function(messageObj) {
                if (messageObj.room === roomName) {
                    fonction(messageObj);
                }
            });
            this.listeners.push(listener);
            return listener;
        },
        close: function() {
            self.leaveRoom(roomName);
            this.listeners.map(function(listener) {
                listener.delete();
            });
        }
    }
    result.addListener(function(messageObj) {
        if (messageObj.message.__nickname) {
            result.nicknames[messageObj.source] = messageObj.message.__nickname;
        }
    });
    return result;
}
module.exports = SocketBus;

var WSSocket = require('./WSSocket');
var RoomSocket = require('./RoomSocket');
var XhrSocket = require('./XhrSocket');
var Q = require("./Q");
var Random = require("rauricoste-random");
var logger = require("./Logger").getLogger("SocketBus");
var EventStream = require("rauricoste-event-stream");
var Socket = require("./Socket");

var ServerSocket = function(id, messageSocket, roomUpdateStream) {
    this.id = id;
    this.messageSocket = messageSocket;
    this.roomUpdateStream = roomUpdateStream;
}
ServerSocket.prototype.openP2PSocket = function(dest) {
    var self = this;
    var socket = new Socket(this.messageSocket.inStream.filter(function(message) {
        return message.dest && message.dest === self.id;
    }));
    socket.outStream.subscribe(function(message) {
        self.messageSocket.send({
            dest: dest,
            message: message
        });
    });
    return socket;
}
ServerSocket.prototype.openRoomSocket = function(roomName) {
    var self = this;
    self.messageSocket.send({
        server: "JOIN",
        args: [roomName]
    });
    var roomSocket = new Socket(self.messageSocket.inStream.filter(function(message) {
        return message.room === roomName;
    }));
    roomSocket.outStream.subscribe(function(message) {
        self.messageSocket.send({
            room: roomName,
            message: message
        });
    });
    var oldDelete = roomSocket.delete;
    roomSocket.delete = function() {
        self.messageSocket.send({
            server: "LEAVE",
            args: [roomName]
        });
        oldDelete.bind(roomSocket)();
    }
    return roomSocket;
}

var ServerSocketFactory = function(host) {
    var self = this;

    var socketFactory = host.substring(0, 2) === "ws" ? WSSocket : XhrSocket;
    return socketFactory(host).then(function(socket) {
        var defer = Q.defer();
        var messageStream = new EventStream();
        var messageSocket = new Socket(messageStream);
        messageSocket.outStream.subscribe(function(message) {
            socket.send(JSON.stringify(message));
        })
        var roomUpdateStream = new EventStream();
        var receiveFct = function(messageStr) {
            var message = JSON.parse(messageStr);
            logger.debug("raw message", message);
            if (message.server) {
                switch(message.server) {
                    case "ID":
                        self.id = message.id;
                        logger.info("SocketBus connected to "+self.usedHost+" with id "+self.id);
                        defer.resolve(new ServerSocket(message.id, messageSocket, roomUpdateStream));
                        break;
                    case "ERROR":
                        logger.error(message.originalMessage, message.error);
                        break;
                    case "JOIN":
                        logger.info("joined room "+message.room, message.members);
                    case "ROOM_JOIN":
                    case "ROOM_LEAVE":
                        roomUpdateStream.publish(message);
                        break;
                    default:
                        logger.warn("unknown command", message.server);
                }
                return;
            }
            messageStream.publish(message);
        };
        socket.subscribe(receiveFct);
        return defer.promise;
    })

}

//SocketBus.prototype.send = function(dest, message) {
//    return this.sendObject({
//        dest: dest,
//        message: message
//    });
//}

ServerSocketFactory.logger = require("./Logger");



module.exports = ServerSocketFactory;

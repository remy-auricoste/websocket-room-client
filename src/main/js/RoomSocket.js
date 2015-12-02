var SubSocket = require("./SubSocket");

var RoomSocket = function(name, rootSocket) {
    var self = this;
    this.nicknames = {};
    this.listeners = [];
    this.rootSocket = rootSocket;
    this.name = name;
    this.nicknameSocket = new SubSocket(this, "__nickname");
    this.nicknameSocket.addListener(function(messageObj) {
        self.nicknames[messageObj.source] = messageObj.message;
    });
}
RoomSocket.prototype.send = function(message) {
    return this.rootSocket.sendRoom(this.name, message);
}
RoomSocket.prototype.sendNickName = function(nickname) {
    return this.nicknameSocket.send(nickname);
}
RoomSocket.prototype.delete = function() {
    this.listeners.map(function(listener) {
        listener.delete();
    });
    this.nicknameSocket.delete();
    this.rootSocket.leaveRoom(this.name);
}
RoomSocket.prototype.getRoomUsers = function() {
    var self = this;
    return Object.keys(self.nicknames).map(function(id) {
        var nickname = self.nicknames[id];
        return {
            id: id,
            nickname: nickname
        }
    });
}
RoomSocket.prototype.addListener = function(fonction) {
    var self = this;
    var listener = this.rootSocket.addListener(function(messageObj) {
        if (messageObj.room && messageObj.room === self.name) {
            fonction(messageObj);
        }
    });
    this.listeners.push(listener);
    return listener;
}
RoomSocket.prototype.getId = function() {
    return this.rootSocket.id;
}
RoomSocket.prototype.subSocket = function(name) {
    return new SubSocket(this, name);
}

module.exports = RoomSocket;

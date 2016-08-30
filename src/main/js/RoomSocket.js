var RoomSocket = function(name, rootSocket, socket) {
    this.rootSocket = rootSocket;
    this.socket = socket;
    this.name = name;
}
RoomSocket.prototype.send = function(message) {
    return this.socket.send(message);
}
RoomSocket.prototype.delete = function() {
    this.socket.delete();
    this.rootSocket.leaveRoom(this.name);
}
RoomSocket.prototype.getRoomUsers = function() {
    return this.rootSocket.rooms[this.name];
}
RoomSocket.prototype.addListener = function(fonction) {
    return this.socket.subscribe(fonction);
}
RoomSocket.prototype.getId = function() {
    return this.rootSocket.id;
}
RoomSocket.prototype.subSocket = function(name) {
    return this.socket.subSocket(name);
}

module.exports = RoomSocket;

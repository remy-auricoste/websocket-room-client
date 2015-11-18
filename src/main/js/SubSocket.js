var SubSocket = function(parentSocket, key) {
    this.parentSocket = parentSocket;
    this.key = key;
    this.listeners = [];
}
SubSocket.prototype.send = function(message) {
    var self = this;
    var finalMessage = {};
    finalMessage[self.key] = message;
    this.parentSocket.send(finalMessage);
}
SubSocket.prototype.addListener = function(fonction) {
    var self = this;
    var listener = this.parentSocket.addListener(function(messageObj) {
        if (messageObj.message[self.key]) {
            fonction({
                source: messageObj.source,
                room: messageObj.room,
                dest: messageObj.dest,
                message: messageObj.message[self.key]
            });
        }
    });
    this.listeners.push(listener);
    return listener;
}
SubSocket.prototype.delete = function() {
    this.listeners.map(function(listener) {
        listener.delete();
    });
}
SubSocket.prototype.subSocket = function(key) {
    return new SubSocket(this, key);
}
SubSocket.prototype.getId = function() {
    return this.parentSocket.getId();
}

module.exports = SubSocket;
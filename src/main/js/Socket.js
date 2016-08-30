var EventStream = require("rauricoste-event-stream");

var Socket = function(inStream, outStream) {
    this.inStream = inStream || new EventStream();
    this.outStream = outStream || new EventStream();
}
Socket.prototype.send = function(message) {
    return this.outStream.publish(message);
}
Socket.prototype.subscribe = function(fonction) {
    return this.inStream.subscribe(fonction);
}
Socket.prototype.subSocket = function(key) {
    return new Socket(this.inStream.subEventStream(key), this.outStream.subEventStream(key));
}

module.exports = Socket;
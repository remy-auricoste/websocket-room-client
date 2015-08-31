var SocketBus = require("./SocketBus");

var socketBus = new SocketBus("ws://localhost:8001/", function(message) {
    console.log("receive", message);
}, function(roomChange) {
    console.log("room change", JSON.stringify(roomChange));
});

socketBus.joinRoom("testRoom");
socketBus.sendRoom("testRoom", "hello");
//socketBus.sendRoom("testRoom", {complexObject: 1});
var SocketBus = require("./SocketBus");

var socketBus = new SocketBus({
    host: "localhost:8001",
    onReceive: function(message) {
        console.log("receive", message);
    },
    onRoomChange: function(roomChange) {
        console.log("room change", JSON.stringify(roomChange));
    }
});

socketBus.joinRoom("testRoom");
socketBus.sendRoom("testRoom", "hello");
//socketBus.sendRoom("testRoom", {complexObject: 1});
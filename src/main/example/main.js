var ServerSocket = require("../js/ServerSocket");

new ServerSocket("http://localhost:8001/socket").then(function(serverSocket) {
    console.log("id", serverSocket.id);
    serverSocket.messageSocket.subscribe(function(message) {
        console.log("receive", message);
    });
    serverSocket.roomUpdateStream.subscribe(function(roomChange) {
        console.log("room change", roomChange);
    });

    var roomSocket = serverSocket.openRoomSocket("testRoom");
    roomSocket.subscribe(function(message) {
        console.log("room message", message);
    });
    roomSocket.send("hello I am "+serverSocket.id);
    serverSocket.openP2PSocket(serverSocket.id).send("plop");
}).catch(function(err) {
    console.error(err);
})

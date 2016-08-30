var ServerSocket = require("../js/ServerSocket");

new ServerSocket("http://localhost:8001/socket").then(function(serverSocket) {
    serverSocket.messageSocket.subscribe(function(message) {
        console.log("receive", message);
    });
    serverSocket.roomUpdateStream.subscribe(function(roomChange) {
        console.log("room change", roomChange);
    });

    var roomSocket = serverSocket.openRoomSocket("testRoom");
    console.log("room subscribe");
    roomSocket.subscribe(function(message) {
        console.log("room message", message);
    });
    roomSocket.send("hello "+new Date().getTime());
}).catch(function(err) {
    console.error(err);
})

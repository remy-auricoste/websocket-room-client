var static = require('node-static');
var SocketServer = require("rauricoste-websocket-room-server");

var fileServer = new static.Server('.', {
    cache: 1
});

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response);
    }).resume();
}).listen(8000);

//new SocketServer(8001);
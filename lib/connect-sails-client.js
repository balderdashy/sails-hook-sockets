/**
 * Connect a client socket to the socket.io server.
 *
 * In multi-node (aka clustered) environments with multiple Sails servers
 * sharing a socket store (e.g. using socket.io-redis) this provides a message
 * bus across all nodes, allowing the different Sails servers to communicate.
 */

var socketIOClient = require('socket.io-client');
module.exports = function connectSailsSocketClient(app) {

  // When the Sails admin socket connects, subscribe it to a room identified by its socket ID + port
  app.io.of('/sails').on('connection', function(socket) {
    var roomName = socket.id + ":" + app.config.port;
    socket.join(roomName);
    // Save this socket on the hook
    app.hooks.sockets.adminSocket = socket;
  });

  // Connect a socket to the socket.io server
  var socket = socketIOClient("http://localhost:" + app.config.port + "/sails", {multiplex: false});

  // When the socket receives an event named `sails`, forward it to this Sails app's
  // main event bus using a `hook:sockets:adminMessage` event.
  socket.on("sails", function(data) {
    app.log.silly("Admin socket received message with data: ", data);
    app.emit("hook:sockets:adminMessage", data);
  });

  app.hooks.sockets.adminSocket = socket;

};

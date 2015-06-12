module.exports = function broadcastAdminMessage(app) {

  return function sendMessage(event, payload) {

    // If the admin socket is connected, send the message
    if (app.hooks.sockets.adminSocket) {
      sendMsg();
    }
    // Otherwise queue it up to be sent once the socket is connected
    else {
      app.once('hook:sockets:adminSocketConnected', sendMsg);
    }

    // Broadcast the message to all (other) sockets connected to the admin bus
    function sendMsg() {
      app.hooks.sockets.adminSocket.broadcast.emit("sails",{
        event: event,
        payload: payload
      });
    }

  };

};

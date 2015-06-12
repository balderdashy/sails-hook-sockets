module.exports = function blastAdminMessage(app) {

  return function sendMessage(event, payload) {

    // If the admin socket is connected, send the message
    if (app.hooks.sockets.adminSocket) {
      sendMsg();
    }
    // Otherwise queue it up to be sent once the socket is connected
    else {
      app.once('hook:sockets:adminSocketConnected', sendMsg);
    }

    function sendMsg() {
      // Broadcast the message to all (other) sockets connected to the admin bus
      app.hooks.sockets.broadcastAdminMessage(event, payload);
      // Send the message to the sender socket as well
      app.hooks.sockets.adminSocket.emit("sails",{
        event: event,
        payload: payload
      });
    }

  };

};

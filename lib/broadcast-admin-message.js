module.exports = function broadcastAdminMessage(app) {

  return function (event, payload) {

    if (app.hooks.sockets.adminSocket.connected) {
      sendMsg();
    } else {
      app.hooks.sockets.adminSocket.on('connect', sendMsg);
    }

    function sendMsg() {
      app.hooks.sockets.adminSocket.broadcast.emit("sails",{
        event: event,
        payload: payload
      });
    }

  };

};

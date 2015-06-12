module.exports = function blastAdminMessage(app) {

  return function (event, payload) {

    if (app.hooks.sockets.adminSocket.connected) {
      sendMsg();
    } else {
      app.hooks.sockets.adminSocket.on('connect', sendMsg);
    }

    function sendMsg() {
      app.hooks.sockets.broadcastAdminMessage(event, payload);
      app.hooks.sockets.adminSocket.emit("sails",{
        event: event,
        payload: payload
      });
    }

  };

};

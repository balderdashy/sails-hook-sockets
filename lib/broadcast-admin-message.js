module.exports = function broadcastAdminMessage(app) {

  return function (event, payload) {

    if (sails.hooks.sockets.adminSocket.connected) {
      sendMsg();
    } else {
      sails.hooks.sockets.adminSocket.on('connect', sendMsg);
    }

    function sendMsg() {
      sails.hooks.sockets.adminSocket.broadcast.emit("sails",{
        event: event,
        payload: payload
      });
    }

  };

};

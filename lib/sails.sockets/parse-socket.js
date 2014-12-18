module.exports = function (app){
  return function parseSocket(socket){

    // If the thing passed in looks like `req`, not a socket, then use its
    // req.socket instead if possible.
    if (socket && socket.socket && socket.socket.join && socket.socket.emit && socket.end) {
      socket = socket.socket;
    }

    // Make sure the thing is a socket
    if (socket && socket.emit && socket.join) {
      return socket;
    }

    // Otherwise return undefined.
    return undefined;
  };
};

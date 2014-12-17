/**
 * Module dependencies
 */

var _ = require('lodash');




module.exports = function (app){

  /**
   * Parse the ID from the given socket object
   *
   * @param  {Socket|req} socket [The socket object to get the ID of]
   * @return {String|undefined}  [The socket's ID]
   */
  return function parseSocketId(socket) {
    // If a `req` was passed in, get its socket
    socket = socket.socket || socket;
    if (socket) {
      return socket.id;
    } else return undefined;
  };
};

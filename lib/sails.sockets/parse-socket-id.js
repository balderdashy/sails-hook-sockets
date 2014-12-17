/**
 * Module dependencies
 */

var _ = require('lodash');




module.exports = function (app){

  /**
   * Get the ID of a socket object
   * @param  {object} socket The socket object to get the ID of
   * @return {string}        The socket's ID
   */
  return function parseSocketId(socket) {
    // If a request was passed in, get its socket
    socket = socket.socket || socket;
    if (socket) {
      return socket.id;
    } else return undefined;
  };
};

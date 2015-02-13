/**
 * Module dependencies
 */

var _ = require('lodash');



module.exports = function(app) {

  /**
   * Unsubscribe a socket from a generic room
   * @param  {object} socket   The socket to unsubscribe.
   * @param  {string} roomName The room to unsubscribe from
   */
  return function leaveRoom (sockets, roomName) {

    if (!_.isArray(sockets)) {
      sockets = [sockets];
    }

    _.each(sockets, function(socket) {
      // If a string was sent, try to look up a socket with that ID
      if (typeof socket !== 'object') {
        socket = app.sockets.get(socket+'');
      }

      // If it's not a valid socket object, bail
      socket = app.sockets.parseSocket(socket);
      if (!socket) {
        app.log.warn("Attempted to call `sailsSockets.leave`, but the first argument was not a socket.");
        return;
      }

      // See ya!
      socket.leave(roomName);
    });

    return true;
  };
};

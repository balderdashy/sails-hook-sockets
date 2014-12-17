/**
 * Module dependencies
 */

var _ = require('lodash');



module.exports = function(app) {

  /**
   * Subscribe a socket to a generic room
   *
   * @param  {Object} socket   The socket to subscribe.
   * @param  {String} roomName The room to subscribe to
   */

  return function joinRoom (sockets, roomName) {

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
        app.log.warn('Attempted to call `sailsSockets.join`, but the first argument was not a socket.');
        return;
      }
      // Join up!
      socket.join(roomName);

    });

    return true;

  };

};

/**
 * Module dependencies
 */

var _ = require('lodash');



module.exports = function(app) {

  /**
   * Subscribe a socket to a generic room
   *
   * @param  {Object} sockets   The socket or sockets to subscribe.
   * @param  {String} roomName The room to subscribe to
   * @param  {Function} cb Optional callback to call after join is completed
   */

  return function joinRoom (sockets, roomName, cb) {

    // Make sure "sockets" is an array
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
      socket.join(roomName, cb);

    });

    return true;

  };

};

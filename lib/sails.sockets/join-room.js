/**
 * Module dependencies
 */

var _ = require('lodash');
var async = require('async');


module.exports = function(app) {

  /**
   * Subscribe a socket to a generic room
   *
   * @param  {Object} sockets   The socket or sockets to subscribe.
   * @param  {String} roomName The room to subscribe to
   * @param  {Function} cb Optional callback to call after join is completed
   */

  return function joinRoom (sockets, roomName, cb) {

    // Make cb optional
    cb = cb || function(){};

    // Make sure "sockets" is an array
    if (!_.isArray(sockets)) {
      sockets = [sockets];
    }

    async.each(sockets, function(socket, nextSocket) {
      // If a string was sent, try to look up a socket with that ID
      if (typeof socket !== 'object' && socket !== null) {
        // If we don't find one, it could be on another server, so use
        // the cross-server "addRoomMembersToRooms"
        if (!app.io.sockets.connected[socket]) {
          return app.sockets.addRoomMembersToRooms(socket, roomName, nextSocket);
        }
        // Otherwise get the socket object and continue
        socket = app.io.sockets.connected[socket];
      }

      // If it's not a valid socket object, bail
      socket = app.sockets.parseSocket(socket);
      if (!socket) {
        app.log.warn('Attempted to call `sailsSockets.join`, but the first argument was not a socket.');
        return;
      }
      // Join up!
      socket.join(roomName, nextSocket);

    }, cb);

    return true;

  };

};

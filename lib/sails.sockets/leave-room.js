/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var async = require('async');


module.exports = function(app) {

  /**
   * Unsubscribe a socket from a generic room
   *
   * @param  {object} sockets   The socket or sockets to unsubscribe.
   * @param  {string} roomName The room to unsubscribe from
   * @param  {Function} cb Optional callback to call after leave is completed
   */
  return function leaveRoom (sockets, roomName, cb) {

    // Make cb optional
    cb = cb || function(){};

    // Make sure "sockets" is an array
    if (!_.isArray(sockets)) {
      sockets = [sockets];
    }

    sockets.forEach((socket)=> {
      // If a string was sent, try to look up a socket with that ID
      if (typeof socket !== 'object' && socket !== null) {
        // If we don't find one, it could be on another server, so use
        // the cross-server "removeRoomMembersFromRooms"
        if (!app.io.of('/').sockets.has(socket)) {
          return app.sockets.removeRoomMembersFromRooms(socket, roomName);
        }
        // Otherwise get the socket object and continue
        socket = app.io.of('/').sockets.get(socket);
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

    // Call the callback once all sockets have left
    cb();
    // The value returned from this function is currently used by the Sails PubSub hook.
    // FUTURE: When https://github.com/balderdashy/sails/pull/7311/files is merged, this return value can be removed.
    return true;
  };
};

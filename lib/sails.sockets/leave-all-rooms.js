/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var async = require('async');

module.exports = function(app) {

  /**
   * Unsubscribe all sockets from sourceRoom from all rooms
   *
   * @param  {String} sourceRoom   The room to get members of
   * @param  {Function} cb Optional callback to call after leave is completed
   */

  return function leaveAllRooms (sourceRoom, options, cb) {

    // Make options optional
    if ('function' == typeof options) {
      cb = options;
      options = {};
    }

    options = _.defaults(options || {}, {
      includeSocketRooms: false,
      includeSourceRoom: true
    });

    // Make cb optional
    cb = cb || function(){};

    // Make sure "sourceRoom" is a string
    if (!_.isString(sourceRoom)) {
      if (!cb) {app.log.error("Non string value used as `sourceRoom` argument in `leaveAllRooms`: ", sourceRoom);}
      return cb(new Error("Non string value used as `sourceRoom` argument in `leaveAllRooms`"));
    }

    // Broadcast an admin message telling all other connected servers to
    // run `leaveAll` with the same arguments, unless the
    // "remote" flag is set
    if (!this.remote) {
      app.hooks.sockets.broadcastAdminMessage('leaveAll', {sourceRoom: sourceRoom});
    }

    // Look up all members of sourceRoom
    return (function(iifeDone) { app.io.in(sourceRoom).allSockets().then(function(sourceRoomSocketIds) {iifeDone(undefined, sourceRoomSocketIds);}).catch(function(err) { iifeDone(err);});})(function(err, sourceRoomSocketIds) {
      if (err) { return cb(err); }
      // Loop through the socket IDs from the room
      sourceRoomSocketIds.forEach((socketId) => {
        // Check if the socket is connected to this server
        if (app.io.of('/').sockets.has(socketId)) {
          // If so, unsubscribe it from all rooms it is currently subscribed to
          var socket = app.io.of('/').sockets.get(socketId);
          // Create an array from the set of socket rooms.
          var destRooms = Array.from(socket.rooms);
          destRooms.forEach((destRoom) => {
            // Don't unsubscribe a socket from its own room unless we're explicitly asked to
            if (options.includeSocketRooms !== true && destRoom == socketId) {return;}
            // Don't unsubscribe a socket from its the source room unless we're explicitly asked to
            if (options.includeSourceRoom !== true && destRoom == sourceRoom) {return;}
            socket.leave(destRoom);
          }); // For each destRoom.
        }
      });
      cb();
    });

  };

};

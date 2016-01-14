/**
 * Module dependencies
 */

var _ = require('lodash');
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
    return app.io.sockets.in(sourceRoom).clients(function(err, sourceRoomSocketIds) {
      if (err) {return cb(err);}
      // Loop through the socket IDs from the room
      async.each(sourceRoomSocketIds, function(socketId, nextSocketId) {
        // Check if the socket is connected to this server (since .clients() may someday work cross-server)
        if (app.io.sockets.connected[socketId]) {
          // If so, unsubscribe it from all rooms it is currently subscribed to
          var socket = app.io.sockets.connected[socketId];
          var destRooms = _.keys(socket.rooms);
          return async.each(destRooms, function(destRoom, nextRoom) {
            // Don't unsubscribe a socket from its own room unless we're explicitly asked to
            if (options.includeSocketRooms !== true && destRoom == socketId) {return nextRoom();}
            // Don't unsubscribe a socket from its the source room unless we're explicitly asked to
            if (options.includeSourceRoom !== true && destRoom == sourceRoom) {return nextRoom();}
            return socket.leave(destRoom, nextRoom);
          }, nextSocketId);
        }
        // If not, just continue
        return nextSocketId();
      }, cb);
    });

  };

};

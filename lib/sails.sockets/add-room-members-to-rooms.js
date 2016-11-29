/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var async = require('async');


module.exports = function(app) {

  /**
   * Subscribe all sockets from sourceRoom to destRoom
   *
   * @param  {String} sourceRoom   The room to get members of
   * @param  {String} destRooms The room to subscribe the members of sourceRoom to
   * @param  {Function} cb Optional callback to call after join is completed
   */

  return function addRoomMembersToRooms (sourceRoom, destRooms, cb) {

    // Make cb optional
    cb = cb || function(){};

    // Make sure "sourceRoom" is a string
    if (!_.isString(sourceRoom)) {
      if (!cb) {app.log.error("Non string value used as `sourceRoom` argument in `addRoomMembersToRooms`: ", sourceRoom);}
      return cb(new Error("Non string value used as `sourceRoom` argument in `addRoomMembersToRooms`"));
    }

    // Ensure that destRooms is an array
    if (!_.isArray(destRooms)) {
      destRooms = [destRooms];
    }

    // If we were sent a socket ID as a room name, and the socket happens to
    // be connected to this server, take a shortcut
    if (app.io.sockets.connected[sourceRoom]) {
      return doJoin(app.io.sockets.connected[sourceRoom], cb);
    }

    // Broadcast an admin message telling all other connected servers to
    // run `addRoomMembersToRooms` with the same arguments, unless the
    // "remote" flag is set
    if (!this.remote) {
      app.hooks.sockets.broadcastAdminMessage('join', {sourceRoom: sourceRoom, destRooms: destRooms});
    }


    // Look up all members of sourceRoom
    return app.io.sockets.in(sourceRoom).clients(function(err, sourceRoomSocketIds) {
      if (err) {return cb(err);}
      // Loop through the socket IDs from the room
      async.each(sourceRoomSocketIds, function(socketId, nextSocketId) {
        // Check if the socket is connected to this server (since .clients() may someday work cross-server)
        if (app.io.sockets.connected[socketId]) {
          // If so, subscribe it to destRooms
          return doJoin(app.io.sockets.connected[socketId], nextSocketId);
        }
        // If not, just continue
        return nextSocketId();
      }, cb);
    });

    function doJoin(socket, cb) {
      return async.each(destRooms, function(destRoom, nextRoom) {
        // Ensure destRoom is a string
        if (!_.isString(destRoom)) {
          app.log.warn("Skipping non-string value for room name to add in `addRoomMembersToRooms`: ", destRoom);
          return nextRoom();
        }
        return socket.join(destRoom, nextRoom);
      }, cb);
    }

  };

};

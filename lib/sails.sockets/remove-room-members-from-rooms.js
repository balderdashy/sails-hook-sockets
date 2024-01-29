/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var async = require('async');


module.exports = function(app) {

  /**
   * Unsubscribe all sockets from sourceRoom from destRooms
   *
   * @param  {String} sourceRoom   The room to get members of
   * @param  {String} destRoom The rooms to unsubscribe the members of sourceRoom from
   * @param  {Function} cb Optional callback to call after leave is completed
   */

  return function removeRoomMembersFromRooms (sourceRoom, destRooms, cb) {

    // Make cb optional
    cb = cb || function(){};

    // Make sure "sourceRoom" is a string
    if (!_.isString(sourceRoom)) {
      if (!cb) {app.log.error("Non string value used as `sourceRoom` argument in `removeRoomMembersFromRooms`: ", sourceRoom);}
      return cb(new Error("Non string value used as `sourceRoom` argument in `removeRoomMembersFromRooms`"));
    }

    // Ensure that destRooms is an array
    if (!_.isArray(destRooms)) {
      destRooms = [destRooms];
    }

    // If we were sent a socket ID as a room name, and the socket happens to
    // be connected to this server, take a shortcut
    if (app.io.of('/').sockets.has(sourceRoom)) {
      doLeave(app.io.of('/').sockets.get(sourceRoom));
      return cb();
    }

    // Broadcast an admin message telling all other connected servers to
    // run `removeRoomMembersFromRooms` with the same arguments, unless the
    // "remote" flag is set
    if (!this.remote) {
      app.hooks.sockets.broadcastAdminMessage('leave', {sourceRoom: sourceRoom, destRooms: destRooms});
    }

    // Look up all members of sourceRoom
    return (function(iifeDone) { app.io.in(sourceRoom).allSockets().then(function(sourceRoomSocketIds) {iifeDone(undefined, sourceRoomSocketIds);}).catch(function(err) { iifeDone(err);});})(function(err, sourceRoomSocketIds) {
      if (err) { return cb(err); }
      // Loop through the socket IDs from the room
      sourceRoomSocketIds.forEach(function(socketId) {
        // Check if the socket is connected to this server
        if (app.io.of('/').sockets.has(socketId)) {
          // If so, unsubscribe it from destRooms
          doLeave(app.io.of('/').sockets.get(socketId));
        }
        // If not, just continue
      });
      cb();
    });//_∏_


    function doLeave(socket) {
      destRooms.forEach(function(destRoom) {
        // Ensure destRoom is a string
        if (!_.isString(destRoom)) {
          app.log.warn("Skipping non-string value for room name to add in `addRoomMembersToRooms`: ", destRoom);
        } else {
          socket.leave(destRoom);
        }
      });
    }

  };

};

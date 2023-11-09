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
    app.io.of('/').in(sourceRoom).allSockets()
      .then((sourceRoomSocketIds) => {
        sourceRoomSocketIds.forEach((socketId) => {
          let socket = app.io.of('/').sockets.get(socketId);
          if (socket) {
            let destRooms = Array.from(socket.rooms);
            destRooms.forEach((destRoom) => {
              if ((options.includeSocketRooms !== true && destRoom === socketId) ||
                  (options.includeSourceRoom !== true && destRoom === sourceRoom)) {
                return;
              }
              socket.leave(destRoom);
            });
          }
        });
        cb();
      })
      .catch((err) => {
        cb(err);
      });

    return true;
  };

};

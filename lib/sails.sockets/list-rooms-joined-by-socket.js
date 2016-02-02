/**
 * Module dependencies
 */

var _ = require('lodash');
var ERRORPACK = require('../errors');



module.exports = function (app){

  /**
   * Get the list of rooms a socket is subscribed to
   *
   * @param  {Socket} socket The socket to get rooms for
   *
   * @throws {NO_SUCH_SOCKET}
   * @throws {NO_SUCH_NAMESPACE}
   * @throws {USAGE}
   */
  return function listRoomsJoinedBySocket (socket) {

    app.log.debug('sails.sockets.socketRooms() is deprecated (see `http://sailsjs.org/documentation/concepts/upgrading/to-v-0-12`)');

    if (!socket) {
      throw ERRORPACK.USAGE('`sails.sockets.socketRooms()` cannot lookup room membership w/o an id or socket instance (got: `%s`)', socket);
    }

    // If the thing passed in looks like `req`, not a socket, then use its
    // req.socket instead if possible.
    socket = app.sockets.parseSocket(socket);

    // If we didn't detect a valid socket, bail with an error
    if (_.isUndefined(socket)) {
      throw ERRORPACK.USAGE('`sails.sockets.socketRooms()` cannot lookup room membership :: Invalid socket instance');
    }

    // Return the list of rooms this socket is assigned to.
    // Since socket.io v1.4, rooms is an object
    return _.keys(socket.rooms);

  };
};

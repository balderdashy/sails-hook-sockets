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
   * @return {array} An array of room names
   *
   * @throws {NO_SUCH_SOCKET}
   * @throws {NO_SUCH_NAMESPACE}
   * @throws {USAGE}
   */
  return function listRoomsJoinedBySocket (socket) {

    if (!socket) {
      throw ERRORPACK.USAGE('`sails.sockets.socketRooms()` cannot lookup room membership w/o an id or socket instance (got: `%s`)', socket);
    }

    // If the thing passed in looks like `req`, not a socket, then use its
    // req.socket instead if possible.
    socket = app.sockets.parseSocket(socket);


    var id;

    // Looks like a socket...
    if (_.isObject(socket) && _.isFunction(socket.emit)) {
      id = socket.id;
    }
    else {
      id = socket;
    }

    if (!_.isString(id) && !_.isNumber(id)) {
      throw ERRORPACK.USAGE('`sails.sockets.socketRooms()` cannot lookup room membership :: Invalid id or socket instance: %s', id);
    }

    // Cast `id` to string
    id = id+'';

    // `namespaceId` is the "pathname identifier" of the namespace.
    // (the default namespace is identified by "/")
    var namespaceId = '/';

    // based on solution here: http://stackoverflow.com/a/24145381/486547
    var namespace = app.io.of(namespaceId);
    if (!namespace) {
      throw ERRORPACK.NO_SUCH_NAMESPACE('`sails.sockets.socketRooms()` cannot lookup room membership :: Cannot find namespace with pathname identifier=`%s`', namespaceId);
    }

    var foundSocket = namespace.connected[id];
    if (!foundSocket) {
      throw ERRORPACK.NO_SUCH_SOCKET('`sails.sockets.socketRooms()` cannot lookup room membership :: Cannot find socket with id=`%s`', id);
    }

    // Since socket.io v1.4, rooms is an object
    return _.keys(foundSocket.rooms);


  };
};

/**
 * Module dependencies
 */

var _ = require('lodash');




module.exports = function (app){

  /**
   * Parse the ID from the given socket object
   *
   * @param  {Socket|req} socket [The socket object to get the ID of]
   * @return {String|undefined}  [The socket's ID]
   */
  return function parseSocketId(socket) {

    if (this.usingDeprecatedFnName) {
      app.log.debug('sails.sockets.id() is deprecated; use sails.sockets.getId() (see `http://sailsjs.org/documentation/concepts/upgrading/to-v-0-12`)');
    }

    // If the thing passed in looks like `req`, not a socket, then use its
    // req.socket instead if possible.
    socket = app.sockets.parseSocket(socket);

    if (!socket) return undefined;
    return socket.id;

  };
};

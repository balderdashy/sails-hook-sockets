/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var ERRORPACK = require('../errors');


module.exports = function (app){


  /**
   * Use the provided `id` to look up and return the socket instance that it represents.
   *
   * @param  {String} id
   * @return {Socket}
   *
   * @throws {NO_SUCH_SOCKET}
   * @throws {NO_SUCH_NAMESPACE}
   * @throws {USAGE}
   */
  return function getSocketById (id){
    if (!id) {
      throw ERRORPACK.USAGE('`sails.sockets.get()` cannot lookup socket w/o an id (got: `%s`)', id);
    }
    if (!_.isString(id) && !_.isNumber(id)) {
      throw ERRORPACK.USAGE('Cannot lookup socket w/ invalid id: %s', id);
    }

    // Look for a socket with the specified ID in the default namespace
    var foundSocket = app.io.sockets.connected[id];
    if (!foundSocket) {
      throw ERRORPACK.NO_SUCH_SOCKET('Cannot find socket with id=`%s`', id);
    }

    return foundSocket;
  };
};

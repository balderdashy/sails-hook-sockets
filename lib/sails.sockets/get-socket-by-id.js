/**
 * Module dependencies
 */

var _ = require('lodash');
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

    // Cast `id` to string
    id = id+'';

    // `namespaceId` is the "pathname identifier" of the namespace.
    // (the default namespace is identified by "/")
    var namespaceId = '/';

    // based on solution here: http://stackoverflow.com/a/24145381/486547
    var namespace = app.io.of(namespaceId);
    if (!namespace) {
      throw ERRORPACK.NO_SUCH_NAMESPACE('Cannot find namespace with pathname identifier=`%s`', namespaceId);
    }

    var foundSocket = namespace.connected[id+''];
    if (!foundSocket) {
      throw ERRORPACK.NO_SUCH_SOCKET('Cannot find socket with id=`%s`', id);
    }

    return foundSocket;
  };
};

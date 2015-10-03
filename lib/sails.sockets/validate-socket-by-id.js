/**
 * Module dependencies
 */

var _ = require('lodash');
var ERRORPACK = require('../errors');


module.exports = function (app){


  /**
   * Use the provided `id` to validate and return true if socket exists.
   *
   * @param  {String} id
   * @return {Socket}
   *
   * @throws {NO_SUCH_NAMESPACE}
   * @throws {USAGE}
   */
  return function getSocketById (id){
    if (!id) {
      throw ERRORPACK.USAGE('`sails.sockets.validate()` cannot validate socket w/o an id (got: `%s`)', id);
    }
    if (!_.isString(id) && !_.isNumber(id)) {
      throw ERRORPACK.USAGE('Cannot validate socket w/ invalid id: %s', id);
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
      return false;
    }

    return true;
  };
};

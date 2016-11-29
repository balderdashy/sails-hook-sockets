/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');



module.exports = function isProbablySocket(socket) {
  if (!_.isObject(socket)) {
    return false;
  }
  // TODO:
  // check that it is a valid socket.io Socket instance
  // (duck-type, not instanceof- we just care that it has the right methods)
  return true;
};

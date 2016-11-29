/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');




// check that it is a valid Connect-esque session instance
// (duck-type, not instanceof- we just care that it has the right methods)
module.exports = function isProbablySession(session) {


  // TODO:
  // check that it is a valid connect session instance
  // (duck-type, not instanceof- we just care that it has the right methods)

  if (!_.isObject(session)) {
    return false;
  }
  return true;
};

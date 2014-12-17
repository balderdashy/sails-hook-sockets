/**
 * Module dependencies
 */

var _ = require('lodash');
var ERRORPACK = require('../errors');


module.exports = function (app){


  return function getSocketById (id){
    if (!id) {
      throw ERRORPACK.USAGE('`sails.sockets.get()` cannot lookup socket w/ invalid id: %s', id);
    }
    if (!_.isString(id) && !_.isNumber(id)) {
      throw ERRORPACK.USAGE('Cannot lookup socket w/ invalid id: %s', id);
    }

    throw ERRORPACK.USAGE('TODO: not implemented yet!');
  };
};

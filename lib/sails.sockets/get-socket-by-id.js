/**
 * Module dependencies
 */

var _ = require('lodash');
var UsageError = require('../errors/UsageError');


module.exports = function (app){


  return function getSocketById (id){
    if (!id) {
      throw new UsageError('`sails.sockets.get()` cannot lookup socket w/ invalid id: %s', id);
    }
    if (!_.isString(id) && !_.isNumber(id)) {
      throw new UsageError('Cannot lookup socket w/ invalid id: %s', id);
    }

    throw new UsageError('TODO: not implemented yet!');
  };
};

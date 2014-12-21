/**
 * Module dependencies
 */

var _ = require('lodash');
var createErrorFactory = require('./create-error-factory');


/**
 * @constructor
 */
function Errorpack(){}




/**
 *
 * @param  {[type]} definition [description]
 * @required {String} definition.namespace
 * @required {Object} definition.errors
 * @return {Errorpack}
 */
module.exports = function createErrorpack (definition){

  return _.reduce(definition.errors||{}, function eachErrorType(memo, opts, origCode){
    memo[origCode] = createErrorFactory(_.extend({},opts,{
      code: origCode,
      prefix: definition.namespace + ':'
    }));
    return memo;
  }, new Errorpack());
};

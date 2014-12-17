/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');



/**
 * @constructor
 */

function UsageError(/* messageTpl, data0, data1 */){

  // "util.inspect()"-ify all but the first argument
  var args = Array.prototype.slice.call(arguments);
  _.each(args.slice(1), function (arg, i){
    if (!_.isString(arg) && !_.isNumber(arg)) {
      args[i+1] = util.inspect(arg);
    }
  });
  this.message = util.format.apply(this, args);
  this.code = 'E_USAGE';
  this.status = 500;
}
util.inherits(UsageError, Error);

module.exports = UsageError;

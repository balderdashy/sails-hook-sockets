/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var createErrorConstructor = require('./create-error-constructor');


/**
 * Create a factory method which builds a conventional SJSError object
 * for use within Sails core according to the specified options.
 *
 * @param  {Object} options
 * @optional  {String} options.code     [the unique error code, all caps.  will be prefixed automatically]
 * @optional  {String} options.status   [advisory status code for broad categorization]
 * @optional  {String} options.prefix   [prefix for error code- all caps]
 *
 * @return {Function}
 */

module.exports = function createErrorFactory(options){

  var constructor = createErrorConstructor({
    status: options.status,
    code: options.code,
    prefix: options.prefix
  });

  // This factory function uses a constructor so that instanceof checks,
  // i.e. for use w/ Node core's `assert.throws()`, will work
  var factory = function (/* messageTpl, data0, data1 */){
    var message = determineMessage(arguments);
    return new constructor(message);
  };

  // Save reference to related constructor
  factory.constructor = constructor;

  return factory;
};


/**
 * "util.inspect()"-ify all but the first argument, then it as a template
 * while the other arguments are used as data for that template.
 *
 * @param  {Arguments} constructorArgs
 * @return {String}
 */
function determineMessage(constructorArgs){
  constructorArgs = Array.prototype.slice.call(constructorArgs);
  _.each(constructorArgs.slice(1), function (arg, i){
    if (!_.isString(arg) && !_.isNumber(arg)) {
      constructorArgs[i+1] = util.inspect(arg);
    }
  });
  return util.format.apply(util, constructorArgs);
}

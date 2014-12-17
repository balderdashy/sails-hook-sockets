/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');


/**
 * Create a factory method which builds a conventional SJSError object
 * for use within Sails core according to the specified options.
 *
 * @param  {Object} options
 * @optional  {String} options.code     [the unique error code, all caps.  will be prefixed automatically]
 * @optional  {String} options.status   [advisory status code for broad categorization]
 * @optional  {String} options.name     [readable error name, PascalCase]
 *
 * @return {Function}
 */

module.exports = function createErrorFactory(options){

  var code = determineCode(options.code);
  var name = util.format('Error (%s):', code);
  var status = options.status || 500;

  var factory = function makeSJSError(/* messageTpl, data0, data1 */){

    // Determine message
    var message = determineMessage(arguments);

    // Manufacture an Error instance
    var _err = new Error();
    _err.message = message;
    _err.code = code;
    _err.name = name;
    _err.status = status;

    return _err;
  };

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


/**
 * ERROR_CODE_PREFIX
 * @type {String}
 */
var ERROR_CODE_PREFIX = 'SAILS_';

/**
 * Build error code w/ prefix.
 * @param  {[type]} code [description]
 * @return {[type]}      [description]
 */
function determineCode(code){

  code = (code || 'UNEXPECTED').toUpperCase();
  code = ERROR_CODE_PREFIX + code;
  return code;
}

/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');


/**
 * Create a constructor which builds a conventional SJSError object
 * for use within Sails core according to the specified options.
 *
 * @param  {Object} options
 * @optional  {String} options.code     [the unique error code, all caps.  will be prefixed automatically]
 * @optional  {String} options.status   [advisory status code for broad categorization]
 * @optional  {String} options.name     [readable error name, PascalCase]
 *
 * @return {Function}
 */

module.exports = function createErrorConstructor(options){

  var code = determineCode(options.code);
  var name = util.format('Error (%s):', code);
  var status = options.status || 500;

  // This is mainly here so that instanceof checks,
  // i.e. for use w/ Node core's `assert.throws()`, will work
  var constructor = function (message){
    Error.call(this);

    this.code = code;
    this.name = name;
    this.status = status;
    this.message = message;

    // Manufacture an Error instance
    var _err = new Error();
    _err.message = this.message;
    _err.name = name;

    // Pass through the error's `stack`
    this.stack = _err.stack;
  };
  util.inherits(constructor, Error);

  return constructor;
};



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

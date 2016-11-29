/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');


/**
 * Create a constructor which builds a conventional SJSError object
 * for use within Sails core according to the specified options.
 *
 * @param  {Object} options
 * @optional  {String} options.code     [the "local" unique error code, all caps.  only needs to be local within the namespace/prefix.  will be prefixed automatically]
 * @optional  {String} options.status   [advisory status code for broad categorization]
 * @optional  {String} options.prefix   [prefix for error code- all caps]
 *
 * @return {Function}
 */

module.exports = function createErrorConstructor(options){

  var code = determineCode(options.code, options.prefix);
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
 * Build error code w/ prefix.
 * @param  {[type]} code [description]
 * @param  {[type]} errorCodePrefix [description]
 * @return {[type]}      [description]
 */
function determineCode(code, errorCodePrefix){

  code = code || 'UNEXPECTED';
  code = (errorCodePrefix||'') + code;
  code = code.toUpperCase();
  return code;
}

/**
 * Module dependencies
 */

var Sails = require('sails').Sails;
var lifecycle = require('./helpers/lifecycle.helper');



describe('basic usage', function (){

  before(lifecycle.setup);

  it('should work', function (done){
    done();
  });

  after(lifecycle.teardown);

});

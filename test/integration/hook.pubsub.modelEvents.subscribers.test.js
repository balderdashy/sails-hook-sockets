var assert = require('assert');
var util = require('util');
var _ = require('@sailshq/lodash');
var lifecycle = require('../helpers/lifecycle.helper');

describe('when posting json arrays', function () {

  var sails;

  // Set up "before all" and "after all"
  before(lifecycle.setup);
  after(lifecycle.teardown);

  before(function() {
    sails = global._sails;
  });

  it('should be able to send and receive it as an array', function (done) {
    var postData = [{
      id: 7,
      firstName: 'Jimmy',
      lastName: 'Findingo'
    },{
      id: 8,
      firstName: 'Fanny',
      lastName: 'Findingo'
    }];

    sails.router.bind('POST /arrays', function (req, res) {
      assert.equal(Array.isArray(req.body), true, 'req.body should be an array \nFull req.body:'+util.inspect(req.body, false, null), "==");
      assert.equal(req.body.length, 2);
      assert(_.find(req.body, {id: 7}));
      assert(_.find(req.body, {id: 8}));
      res.json(req.body);
    });

    io.socket.post('/arrays', postData, function (data, jwr) {
      assert.equal(jwr.statusCode, 200, 'Expected 200 status code but got '+jwr.statusCode+'\nFull JWR:'+util.inspect(jwr, false, null));
      assert.equal(Array.isArray(data), true, 'response data should be an array \nFull data:'+util.inspect(data, false, null), "==");
      assert.equal(data.length, 2);
      assert(_.find(data, {id: 7}));
      assert(_.find(data, {id: 8}));
      done();
    });

  });
});

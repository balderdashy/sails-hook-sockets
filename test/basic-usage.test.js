/**
 * Module dependencies
 */

var assert = require('assert');
var util = require('util');
var lifecycle = require('./helpers/lifecycle.helper');

describe('basic usage', function (){

  before(lifecycle.setup);
  after(lifecycle.teardown);

  var sails;
  before(function() {
    sails = global._sails;
  });

  it('should not crash', function (done){
    done();
  });

  it('should not crash after flinging a bunch of requests at it', function (done){

    io.socket.get('/hello');
    io.socket.get('/hello', {});
    io.socket.get('/hello', function (data, jwr){});
    io.socket.get('/hello', {}, function (data, jwr){});

    io.socket.post('/hello');
    io.socket.post('/hello', {});
    io.socket.post('/hello', function (data, jwr){});
    io.socket.post('/hello', {}, function (data, jwr){});

    io.socket.put('/hello');
    io.socket.put('/hello', {});
    io.socket.put('/hello', function (data, jwr){});
    io.socket.put('/hello', {}, function (data, jwr){});

    io.socket.delete('/hello');
    io.socket.delete('/hello', {});
    io.socket.delete('/hello', function (data, jwr){});
    io.socket.delete('/hello', {}, function (data, jwr){});

    done();
  });


  it('should respond to requests as expected', function (done){

    sails.router.bind('GET /friends', function (req, res){
      res.send('yes it worked');
    });
    sails.router.bind('POST /friends', function (req, res){
      // Test that res.send(), when provided an object, passes it
      // back out to the client without stringifying.
      res.send({
        id: 7,
        firstName: 'Jimmy',
        lastName: 'Findingo'
      });
    });

    io.socket.get('/friends', function (data, jwr) {
      assert.equal(jwr.statusCode, 200, 'Expected 200 status code but got '+jwr.statusCode+'\nFull JWR:'+util.inspect(jwr, false, null));
      assert.deepEqual(data, 'yes it worked');

      io.socket.post('/friends', function (data, jwr) {
        assert.equal(jwr.statusCode, 200, 'Expected 200 status code but got '+jwr.statusCode+'\nFull JWR:'+util.inspect(jwr, false, null));
        assert.deepEqual(data, {
          id: 7,
          firstName: 'Jimmy',
          lastName: 'Findingo'
        });
        done();
      });
    });

  });

  describe('should create a request context', function (done){
    var req;
    before(function(done) {
      sails.router.bind('GET /showRequest', function (_req, res){
        req = _req;
        res.send(200);
        return done();
      });
      io.socket.get('/showRequest?abc=123');
    });

    it('with isSocket == true', function() {assert.equal(req.isSocket, true);});
    it('with correct method', function() {assert.equal(req.method, 'GET');});
    it('with correct url', function() {assert.equal(req.url, '/showRequest?abc=123');});
    it('with correct originalUrl', function() {assert.equal(req.originalUrl, '/showRequest?abc=123');});
    it('with correct path', function() {assert.equal(req.path, '/showRequest');});


  });


});

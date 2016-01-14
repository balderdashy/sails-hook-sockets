/**
 * Module dependencies
 */

var assert = require('assert');
var util = require('util');


describe('basic usage', function (){

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

  it('should not expose all of the CORS response headers');


});

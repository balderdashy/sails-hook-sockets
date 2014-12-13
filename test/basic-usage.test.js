/**
 * Module dependencies
 */

var assert = require('assert');
var Sails = require('sails').Sails;
var lifecycle = require('./helpers/lifecycle.helper');

describe('basic usage', function (){

  before(lifecycle.setup);

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
      res.send({
        id: 7,
        firstName: 'Jimmy',
        lastName: 'Findingo'
      });
    });


    io.socket.get('/friends', function (data) {
      assert.deepEqual(data, 'yes it worked');
      io.socket.post('/friends', function (data) {
        assert.deepEqual(data, {
          id: 7,
          firstName: 'Jimmy',
          lastName: 'Findingo'
        });
        done();
      });
    });

  });

  after(lifecycle.teardown);

});

/**
 * Module dependencies
 */

var assert = require('assert');



describe('with session', function (){

  var sails;

  before(function _setupRoutes(){

    sails = global._sails;

    sails.router.bind('PUT /me/jamiroquai', function (req, res){
      req.session.me = {
        id: 8,
        name: 'Jamiroquai'
      };
      res.send(200);
    });

    sails.router.bind('GET /me', function (req, res){
      res.send(req.session.me);
    });
  });


  // Connect a second socket
  var secondSocket;
  before(function (done){

    // Use a weird port to avoid tests failing if we
    // forget to shut down another Sails app
    var TEST_SERVER_PORT = 1577;

    secondSocket = io.sails.connect('http://localhost:'+TEST_SERVER_PORT, {
      multiplex: false
    });
    secondSocket.on('connect', function(){ done(); });
  });

  after(function (){
    secondSocket.disconnect();
  });


  it('should not expose "set-cookie" response header', function (done){
    io.socket.put('/me/jamiroquai', function (unused, jwr) {
      if (jwr.headers['set-cookie']) {
        return done(new Error('Should not expose "set-cookie" response header'));
      }
      return done();
    });
  });

  it('should maintain session between requests', function (done){

    io.socket.put('/me/jamiroquai', function (unused, jwr) {

      io.socket.get('/me', function (data) {
        assert.deepEqual(data, {
          id: 8,
          name: 'Jamiroquai'
        });
        done();
      });
    });

  });


});



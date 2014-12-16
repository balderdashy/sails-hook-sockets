/**
 * Module dependencies
 */

var assert = require('assert');

describe('with session', function (){

  before(function _setupRoutes(){

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


  it('should not expose "set-cookie" response header', function (done){
    io.socket.put('/me/jamiroquai', function (unused, jwr) {
      if (jwr.headers['set-cookie']) {
        return done(new Error('Should not expose "set-cookie" response header'));
      }
      return done();
    });
  });


  it('should not expose all of the CORS response headers');


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



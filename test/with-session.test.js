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


  it('should maintain session between requests', function (done){

    io.socket.put('/me/jamiroquai', function (unused, jwr) {

      console.log('JWR from tests:',jwr);

      io.socket.request({
        method: 'GET',
        url: '/me',
        headers: {
          cookie: jwr.headers['set-cookie']
        }
      },function (data) {
        assert.deepEqual(data, {
          id: 8,
          name: 'Jamiroquai'
        });
        done();
      });
    });

  });
});



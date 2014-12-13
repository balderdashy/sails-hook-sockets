/**
 * Module dependencies
 */

var assert = require('assert');

describe('with session', function (){

  it('should maintain session between requests', function (done){

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

    io.socket.put('/me/jamiroquai', function () {
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



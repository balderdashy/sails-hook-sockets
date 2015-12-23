var assert = require('assert');
var util = require('util');

describe('when posting json arrays', function () {

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
      res.send([{success: "finally!"}]);
    });

    io.socket.post('/arrays', postData, function (data, jwr) {
      assert.equal(jwr.statusCode, 200, 'Expected 200 status code but got '+jwr.statusCode+'\nFull JWR:'+util.inspect(jwr, false, null));
      assert.equal(Array.isArray(data), true, 'response data should be an array \nFull data:'+util.inspect(data, false, null), "==");
      done();
    });


  })
});

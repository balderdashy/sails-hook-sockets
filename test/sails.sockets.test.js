/**
 * Module dependencies
 */

var util = require('util');
var assert = require('assert');
var async = require('async');
var _ = require('lodash');

var ERRORPACK = require('../lib/errors');



describe('low-level socket methods:', function (){

  // Set up helper routes for the tests below
  before(function(){
    sails.get('/socketMethods/helpers/getIdOfRequestingSocket', function(req, res){
      return res.send(req.socket.id);
    });
  });





  // Use the globalized default sails instance
  var TEST_SERVER_PORT = 1577;


  // Connect a few additional sockets for use in the tests below
  // (these will hold **CLIENT-SIDE** SOCKETS!!)
  var starks = {
    ned: undefined,
    bran: undefined,
    jon: undefined,
    arya: undefined,
    sansa: undefined,
    ricket: undefined// or whatever his name is
  };

  // Create a variable to reference our original `io.socket` (the auto-connecting guy)
  // (these will hold a **CLIENT-SIDE** SOCKET!!)
  var theKing;

  before(function (done){

    // Thematically relevant reference to `io.socket`
    theKing = io.socket;
    // console.log('ok, now we\'ve connected the initial socket, let\'s connect some more...');
    async.each(_.keys(starks), function (key, next){
      // console.log('connecting socket for %s',key);
      starks[key] = io.sails.connect('http://localhost:'+TEST_SERVER_PORT, {
        multiplex: false
      });
      starks[key].on('connect', function(){
        // console.log('socket for %s connected!', key);
        next();
      });
    }, function (err) {
      if (err) return done(err);
      done(err);
    });

  });

  after(function (){
    _.each(starks, function (starkSocket){
      starkSocket.disconnect();
    });
  });



  // •----------------------------------------•
  //
  //   ||   Nullipotent functions
  //   \/
  //
  // •----------------------------------------•


  describe('sails.sockets.get()', function (done){


    it('should throw USAGE error when called w/ no arguments', function (){
      assert.throws(function (){
        sails.sockets.get();
      }, ERRORPACK.USAGE.constructor);
    });
    it('should throw USAGE error when called w/ invalid socket id', function (){
      assert.throws(function (){
        sails.sockets.get([
          {
            something:'totally invalid'
          }
        ]);
      }, ERRORPACK.USAGE.constructor);
    });

    it('should return undefined when called w/ string or integer id which does not correspond w/ real socket', function (){
      assert.throws(function (){
        sails.sockets.get(7);
      }, ERRORPACK.NO_SUCH_SOCKET.constructor);
      assert.throws(function (){
        sails.sockets.get('7');
      }, ERRORPACK.NO_SUCH_SOCKET.constructor);
    });

    it('should return a Socket when called w/ a socket id which points to a real socket', function (done){

      _getSocketId(theKing, function (err, socketId) {
        if (err) return done(err);
        try {
          var socket = sails.sockets.get(socketId);
          assert(socket, 'expected socket to exist');
          assert(_.isString(socket.id), 'expected socket to look like a real Socket');
          assert(_.isFunction(socket.emit), 'expected socket to look like a real Socket');
        }
        catch (e) {
          return done(e);
        }
        return done();
      });
    });

  });

  describe('sails.sockets.id()', function() {

    var actualSocketId, sawWarning = false;

    before(function (){
      sails.get('/socketMethods/sails.sockets.id', function (req, res){
        var origWarn = sails.log.warn;
        sails.log.warn = function(msg) {
          sawWarning = true;
          origWarn.apply(this, arguments);
          sails.log.warn = origWarn;
        };
        actualSocketId = req.socket.id;
        var socketId = sails.sockets.id(req.socket);
        return res.send(socketId);
      });
    });

    it('should return the proper socket id', function (done){
      theKing.get('/socketMethods/sails.sockets.id', function (data, jwr){
        if (jwr.error) return done(jwr.error);
        assert.equal(data, actualSocketId, 'should have returned the proper socketId ('+actualSocketId+'), but instead got:'+data);
        return done();
      });
    });

    it('should show a deprecation warning', function() {
      assert(sawWarning);
    });

  });

  describe('sails.sockets.getId()', function (done){

    var actualSocketId;
    before(function (){
      sails.get('/socketMethods/sails.sockets.getid', function (req, res){
        actualSocketId = req.socket.id;

        var result1 = sails.sockets.getId(req.socket);
        assert.equal(result1, actualSocketId);

        var result2 = sails.sockets.getId(req);
        assert.equal(result2, result1);

        return res.send(result1);
      });
    });

    it('should not crash or throw', function (done){
      theKing.get('/socketMethods/sails.sockets.getid', function (data, jwr){
        if (jwr.error) return done(jwr.error);
        return done();
      });
    });

    it('should return a string', function (done){
      theKing.get('/socketMethods/sails.sockets.getid', function (data, jwr){
        if (jwr.error) return done(jwr.error);
        assert(typeof data === 'string', 'should have returned a string, but instead got:'+data);
        return done();
      });
    });

    it('should return the proper socket id', function (done){
      theKing.get('/socketMethods/sails.sockets.getid', function (data, jwr){
        if (jwr.error) return done(jwr.error);
        assert.equal(data, actualSocketId, 'should have returned the proper socketId ('+actualSocketId+'), but instead got:'+data);
        return done();
      });
    });

  });




  describe('sails.sockets.join()', function (){
    before(function _setupRoutes(){
      sails.put('/socketMethods/join', function (req, res){
        // console.log('socket %s joining room %s', sails.sockets.id(req.socket), req.param('room'));
        sails.sockets.join(req, req.param('room'));
        return res.send();
      });
    });
    //
    // we'll use bran for this one
    //
    it('should not crash', function (done){
      starks.bran.put('/socketMethods/join', {
        room: 'test'
      }, function (data, jwr) {
        if (jwr.error) return done(jwr.error);
        return done();
      });
    });
  });




  describe('sails.sockets.socketRooms()', function (done){
    before(function(){
      sails.get('/socketMethods/socketRooms', function(req, res){
        // console.log('socket %s checking room membership...', sails.sockets.id(req.socket));
        var result1 = sails.sockets.socketRooms(req.socket);
        var result2 = sails.sockets.socketRooms(req);
        assert(_.isEqual(result2, result1));
        return res.send(result1);
      });
    });
    it('should not crash or throw', function (done){
      theKing.get('/socketMethods/socketRooms', function (data, jwr) {
        if (jwr.error) return done(jwr.error);
        return done();
      });
    });
    it('should return expected room membership before joining any rooms (1)', function (done){
      theKing.get('/socketMethods/socketRooms', function (data, jwr) {
        if (jwr.error) return done(jwr.error);
        assert.equal(data.length,1, 'expected it to return a membership of 1 room; instead got '+util.inspect(data, false, null));
        return done();
      });
    });
    it('should return expected room membership after joining some rooms', function (done){
      theKing.put('/socketMethods/join', { room: 'beast1' }, function (data, jwr) {
        theKing.put('/socketMethods/join', { room: 'beast2' }, function (data, jwr) {
          theKing.get('/socketMethods/socketRooms', function (data, jwr) {
            if (jwr.error) return done(jwr.error);
            assert.equal(data.length, 3, 'expected it to return a membership of 3 rooms; instead got '+data.length);
            return done();
          });
        });
      });
    });
    it('should properly isolate room membership of different sockets', function (done){
      starks.bran.get('/socketMethods/socketRooms',function (data, jwr) {
        if (jwr.error) return done(jwr.error);
        assert.equal(data.length, 2, 'expected it to return a membership of 2 rooms; instead got '+data.length);
        return done();
      });
    });
  });





  describe('sails.sockets.leave()', function (done){
    before(function(){
      sails.delete('/socketMethods/leave', function(req, res){
        var result1 = sails.sockets.leave(req, req.param('room'));
        return res.send(result1);
      });
    });
    it('should remove the target room from the list of rooms a socket is connected to', function (done){
      theKing.delete('/socketMethods/leave', { room: 'beast1' }, function (data, jwr) {
        if (jwr.error) return done(jwr.error);

        theKing.get('/socketMethods/socketRooms',function (data, jwr) {
          if (jwr.error) return done(jwr.error);
          assert.equal(data.length, 2, 'expected it to return a membership of 2 rooms; instead got '+util.inspect(data));
          assert(_.indexOf(data, 'beast1') === -1, 'expected `beast1` to have been removed from room membership list, but room membership is still: '+data);
          return done();
        });
      });
    });
    it('should warn and not error if passing in null socket', function(done) {
      // Testing fix for #6
      var origWarn = sails.log.warn;
      var sawWarning = false;
      sails.log.warn = function(msg) {
        sawWarning = true;
        origWarn.apply(this, arguments);
        sails.log.warn = origWarn;
      };
      sails.sockets.leave(null);
      assert.equal(sawWarning, true);
      done();
    });
  });




  describe('sails.sockets.broadcast()', function (done){
    before(function(done){
      sails.post('/socketMethods/broadcast', function(req, res){

        // supply "socketToOmit"
        var eventName = 'message';
        sails.sockets.broadcast(req.param('room'), eventName, req.param('data'), req);
        return res.send();
      });

      done();
    });

    describe('king\'s announcement', function (){

      before(function (done){

        // Have all of our starks except for Ned join the 'winterfell' room,
        // AND start listening for "message" events.
        async.each(_.keys(starks), function (key, next){

          // (skip ned)
          if (key === 'ned') return next();

          var clientSocket = starks[key];

          // Listen for message events
          clientSocket.on('message', function (event){
            clientSocket._testMsgsReceived = clientSocket._testMsgsReceived || [];
            clientSocket._testMsgsReceived.push(event);
          });

          // Join the "winterfell" room.
          clientSocket.put('/socketMethods/join', {
            room: 'winterfell'
          }, function (data, jwr) {
            if (jwr.error) return next(jwr.error);
            return next();
          });
        }, function (err){
          if (err) return done(err);

          // Now have the king also join "winterfell"...
          theKing.put('/socketMethods/join', {
            room: 'winterfell'
          }, function (data, jwr){
            if (jwr.error) return next(jwr.error);

            // ...listen for his own announcemnt...
            // (which he should ignore, because our test "broadcast" endpoint below uses the `socketToOmit` arg)
            theKing.on('message', function (event){
              theKing._testMsgsReceived = theKing._testMsgsReceived || [];
              theKing._testMsgsReceived.push(event);
            });

            // ...and make his announcement.
            theKing.post('/socketMethods/broadcast', {
              room: 'winterfell',
              data: {
                stuff: 'and things'
              }
            }, function (data, jwr) {
              if (jwr.error) return done(jwr.error);

              // wait a moment to give socket.io time to deliver the messages
              setTimeout(function (){
                done();
              }, 250);
            });

          });

        });

      });

      describe('living Starks (broadcast to room members)', function (){
        it('should have received a message', function (){
          _.each(starks, function (clientSocket, key){
            // Skip ned
            if (key === 'ned') {
              return;
            }
            assert(clientSocket._testMsgsReceived.length === 1, 'expecting 1 message to be received for the living starks, but got '+clientSocket._testMsgsReceived.length);
          });
        });
      });

      describe('Ned Stark (dont broadcast to outsiders)', function (){
        it('should not have received a message', function (){
          assert(!starks.ned._testMsgsReceived, 'expecting `_testMsgsReceived` to not exist, since no msgs were to be received for ned, but got '+util.inspect(starks.ned._testMsgsReceived));
        });
      });

      describe('The King (dont broadcast to `socketToOmit`)', function (){
        it('should not have received a message (since we used the `socketToOmit` arg)', function (){
          assert(!theKing._testMsgsReceived, 'expecting `_testMsgsReceived` to not exist, since no msgs were to be received for king, but got '+util.inspect(theKing._testMsgsReceived));
        });
      });
    });

  });




  describe('sails.sockets.broadcast() to socket rooms', function (done){
    before(function(){
      sails.post('/socketMethods/broadcastToSocketd', function(req, res){
        sails.sockets.broadcast(req.param('recipients'), undefined, req.param('data'));
        return res.send();
      });
      sails.post('/socketMethods/broadcastToSocketd/otherworldly', function(req, res){
        sails.sockets.broadcast(req.param('recipients'), 'otherworldly', req.param('data'));
        return res.send();
      });
    });

    before(function (done){

      // Look up the socket ids for each Stark
      var starkSocketIds = {};
      async.each(_.keys(starks), function (key, next){
        var clientSocket = starks[key];

        // Listen for the "otherwordly" event type
        clientSocket.on('otherworldly', function(event){
          clientSocket._otherworldlyMsgsReceived = clientSocket._otherworldlyMsgsReceived || [];
          clientSocket._otherworldlyMsgsReceived.push(event);
        });

        // Listen for the "message" event type
        clientSocket.on('message', function(event){
          clientSocket._genericMsgsReceived = clientSocket._genericMsgsReceived || [];
          clientSocket._genericMsgsReceived.push(event);
        });

        // Lookup socket id
        _getSocketId(clientSocket, function (err,socketId){
          if (err) return next(err);
          starkSocketIds[key] = socketId;
          return next();
        });
      }, function afterwards(err) {
        if (err) return done(err);

        // Now have each one of them emit a message to Ned
        async.each(_.keys(starks), function (firstName, next){
          // (skip ned)
          if (firstName === 'ned') return next();

          starks[firstName].post('/socketMethods/broadcastToSocketd/otherworldly', {
            recipients: starkSocketIds.ned,
            data: 'hi pops!'
          }, function (data, jwr){
            if (jwr.error) return next(jwr.error);
            return next();
          });
        }, function (err){
          if (err) return done(err);

          // Now have ricket (or whatever his name is) send a generic message to ned
          starks.ricket.post('/socketMethods/broadcastToSocketd', {
            recipients: starkSocketIds.ned,
            data: 'hi pops!'
          }, function (data, jwr){
            if (jwr.error) return done(jwr.error);

            // Now have Ned emit a message back addressing everyone else
            var arrayOfLivingStarkSocketIds = _.reduce(starkSocketIds, function (memo, socketId, firstName){
              if (firstName !== 'ned') memo.push(socketId);
              return memo;
            }, []);
            starks.ned.post('/socketMethods/broadcastToSocketd/otherworldly', {
              recipients: arrayOfLivingStarkSocketIds,
              data: 'hello children'
            }, function (data, jwr){
              if (jwr.error) return done(jwr.error);
              return done();
            });
          });

        });

      });

    });

    it('should not crash', function (done){
      done();
    });

    describe('living starks', function (){
      it('should have received 1 "otherwordly" msg', function(){
        _.each(starks, function (clientSocket, firstName) {
          // (skip ned)
          if (firstName === 'ned') {
            return;
          }
          assert.equal(clientSocket._otherworldlyMsgsReceived.length, 1, 'expected '+(_.keys(starks).length-1)+' "otherworldly" message for '+firstName+', but got '+clientSocket._otherworldlyMsgsReceived.length);
        });
      });
    });
    describe('ned', function (){
      it('should have received many "otherwordly" msgs', function(){
        assert.equal(starks.ned._otherworldlyMsgsReceived.length, (_.keys(starks).length-1), 'expected '+(_.keys(starks).length-1)+' "otherworldly" messages for Ned, but got '+starks.ned._otherworldlyMsgsReceived.length);
      });
      it('should have received one generic msg from ricket (or whatever his name is)', function(){
        assert.equal(starks.ned._genericMsgsReceived.length, 1, 'expected 1 generic message for Ned, but got '+starks.ned._genericMsgsReceived.length);
      });
    });

  });

  describe('sails.sockets.rooms()', function (done){
    before(function(){
      sails.get('/socketMethods/rooms', function(req, res){
        var roomIds = sails.sockets.rooms();
        return res.send(roomIds);
      });
    });
    it('should not crash', function (done){
      theKing.get('/socketMethods/rooms', function (data, jwr) {
        if (jwr.error) return done(jwr.error);
        assert(_.contains(data, 'beast2'), 'beast2 room should be in array returned from sails.sockets.rooms()');
        assert(_.contains(data, 'test'), 'test room should be in array returned from sails.sockets.rooms()');
        assert(_.contains(data, 'winterfell'), 'winterfell room should be in array returned from sails.sockets.rooms()');
        return done();
      });
    });
  });

  describe('sails.sockets.subscribers() synchronous usage', function (done){
    var sawWarning = false;
    before(function(){
      sails.get('/socketMethods/subscribers', function(req, res){
        var origWarn = sails.log.warn;
        sails.log.warn = function(msg) {
          sawWarning = true;
          origWarn.apply(this, arguments);
          sails.log.warn = origWarn;
        };
        var idsOfRoomMembers = sails.sockets.subscribers('winterfell');
        return res.send(idsOfRoomMembers);
      });
    });

    // Look up the socket ids for each Stark
    var starkSocketIds = {};
    before(function (done){
      async.each(_.keys(starks), function (key, next){
        var clientSocket = starks[key];

        // Lookup socket id
        _getSocketId(clientSocket, function (err,socketId){
          if (err) return next(err);
          starkSocketIds[key] = socketId;
          return next();
        });
      }, function afterwards(err) {
        if (err) return done(err);
        done();
      });
    });

    it('should return all members of room', function (done){
      theKing.get('/socketMethods/subscribers', function (data, jwr) {
        if (jwr.error) return done(jwr.error);
        _.each(starkSocketIds, function (socketId, firstName){
          // skip ned
          if (firstName === 'ned') {
            return;
          }
          assert(_.contains(data, socketId), ''+firstName+' should be in array returned from sails.sockets.subscribers("winterfell")');
        });
        return done();
      });
    });

    it('should show a deprecation warning', function() {
      assert(sawWarning);
    });
  });

  describe('sails.sockets.subscribers() asynchronous usage', function (done){
    before(function(){
      sails.get('/socketMethods/subscribersAsync', function(req, res){
        sails.sockets.subscribers('winterfell', function(err, idsOfRoomMembers) {
          if (err) {return res.serverError(err);}
          return res.send(idsOfRoomMembers);
        });
      });
    });

    // Look up the socket ids for each Stark
    var starkSocketIds = {};
    before(function (done){
      async.each(_.keys(starks), function (key, next){
        var clientSocket = starks[key];

        // Lookup socket id
        _getSocketId(clientSocket, function (err,socketId){
          if (err) return next(err);
          starkSocketIds[key] = socketId;
          return next();
        });
      }, function afterwards(err) {
        if (err) return done(err);
        done();
      });
    });

    it('should return all members of room', function (done){
      theKing.get('/socketMethods/subscribersAsync', function (data, jwr) {
        if (jwr.error) return done(jwr.error);
        _.each(starkSocketIds, function (socketId, firstName){
          // skip ned
          if (firstName === 'ned') {
            return;
          }
          assert(_.contains(data, socketId), ''+firstName+' should be in array returned from sails.sockets.subscribers("winterfell")');
        });
        return done();
      });
    });
  });

  describe('sails.sockets.blast()', function (){
    before(function(){

      // Have the king and all starks listen for the dark mark
      var socketsWhoListenTotheDarkmark = [theKing].concat(_.values(starks));
      // console.log('sockets lisening for the darkmark:', socketsWhoListenTotheDarkmark);
      _.each(socketsWhoListenTotheDarkmark, function (clientSocket, firstName){
        clientSocket.on('darkmark', function (event){
          clientSocket._darkmarkMsgReceived = clientSocket._darkmarkMsgReceived || [];
          clientSocket._darkmarkMsgReceived.push(event);
        });
      });

      sails.post('/socketMethods/blast', function(req, res){
        sails.sockets.blast('darkmark', {
          stuff: 'yeah'
        });
        return res.send();
      });
    });

    it('should send a message to everyone (all starks)', function (done){
      theKing.post('/socketMethods/blast', function (data, jwr) {
        if (jwr.error) return done(jwr.error);

        // Wait a moment to give the sockets time to receive the msg
        setTimeout(function (){
          assert.equal(starks.ned._darkmarkMsgReceived.length, 1, 'expected Ned to receive 1 "darkmark" message, but got '+util.inspect(starks.ned._darkmarkMsgReceived, false, null));
          assert.equal(starks.bran._darkmarkMsgReceived.length, 1, 'expected bran to receive 1 "darkmark" message, but got '+util.inspect(starks.bran._darkmarkMsgReceived, false, null));
          assert.equal(starks.ricket._darkmarkMsgReceived.length, 1, 'expected ricket to receive 1 "darkmark" message, but got '+util.inspect(starks.ricket._darkmarkMsgReceived, false, null));
          assert.equal(starks.arya._darkmarkMsgReceived.length, 1, 'expected arya to receive 1 "darkmark" message, but got '+util.inspect(starks.arya._darkmarkMsgReceived, false, null));
          assert.equal(starks.sansa._darkmarkMsgReceived.length, 1, 'expected sansa to receive 1 "darkmark" message, but got '+util.inspect(starks.sansa._darkmarkMsgReceived, false, null));
          return done();
        }, 500);

      });
    });
  });


});






// Helper methods:
//

/**
 * Given a client-side socket, get its socket id.
 *
 * @param  {[type]}   clientSocket [description]
 * @param  {Function} cb           [description]
 * @return {[type]}                [description]
 */
function _getSocketId(clientSocket, cb){
  clientSocket.get('/socketMethods/helpers/getIdOfRequestingSocket', function (data, jwr){
    if (jwr.statusCode < 200 || jwr.statusCode > 300 || !jwr.body) {
      return cb(new Error('Unexpected result from test helper (statusCode='+jwr.statusCode+', body='+util.inspect(jwr.body, false, null)+')'));
    }
    return cb(null, jwr.body);
  });
}

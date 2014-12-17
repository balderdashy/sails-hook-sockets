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
    bran: undefined,
    rob: undefined,
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

    async.each(_.keys(starks), function (key, next){
      starks[key] = io.sails.connect('http://localhost:'+TEST_SERVER_PORT);
      starks[key].on('connect', function(){
        next();
      });
    }, done);
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
      io.socket.get('/socketMethods/helpers/getIdOfRequestingSocket', function (data, jwr){
        if (jwr.statusCode < 200 || jwr.statusCode > 300) {
          return done(new Error('Unexpected result from test helper (statusCode='+jwr.statusCode+', body='+util.inspect(jwr.body, false, null)+')'));
        }
        try {
          assert.doesNotThrow(function (){
            assert(jwr.body, 'Consistency violation in tests: expecting `jwr.body` ('+jwr.body+') to exist.');
            var socket = sails.sockets.get(jwr.body);
            assert(socket, 'expected socket to exist');
            assert(_.isString(socket.id), 'expected socket to look like a real Socket');
            assert(_.isFunction(socket.emit), 'expected socket to look like a real Socket');
          });
        }
        catch (e) {
          return done(e);
        }
        return done();
      });
    });
  });


  describe('sails.sockets.id()', function (done){
    before(function(){
      sails.get('/socketMethods/id', function(req, res){
        return res.send();
      });
    });
    it('should not crash', function (done){
      io.socket.get('/socketMethods/id', function (data, jwr) {
        done();
      });
    });
  });




  describe('sails.sockets.socketRooms()', function (done){
    before(function(){
      sails.get('/socketMethods/socketRooms', function(req, res){
        return res.send();
      });
    });
    it('should not crash', function (done){
      io.socket.get('/socketMethods/socketRooms', function (data, jwr) {
        done();
      });
    });
  });




  describe('sails.sockets.rooms()', function (done){
    before(function(){
      sails.get('/socketMethods/rooms', function(req, res){
        return res.send();
      });
    });
    it('should not crash', function (done){
      io.socket.get('/socketMethods/rooms', function (data, jwr) {
        done();
      });
    });
  });




  describe('sails.sockets.subscribers()', function (done){
    before(function(){
      sails.get('/socketMethods/subscribers', function(req, res){
        return res.send();
      });
    });
    it('should not crash', function (done){
      io.socket.get('/socketMethods/subscribers', function (data, jwr) {
        done();
      });
    });
  });




  // •----------------------------------------•
  //
  //   ||   The rest
  //   \/
  //
  // •----------------------------------------•


  describe('sails.sockets.join()', function (){
    before(function _setupRoutes(){
      sails.post('/socketMethods/join', function (req, res){
        return res.send();
      });
    });
    it('should not crash', function (done){
      io.socket.post('/socketMethods/join', function (data, jwr) {
        done();
      });
    });
  });




  describe('sails.sockets.leave()', function (done){
    before(function(){
      sails.post('/socketMethods/leave', function(req, res){
        return res.send();
      });
    });
    it('should not crash', function (done){
      io.socket.post('/socketMethods/leave', function (data, jwr) {
        done();
      });
    });
  });




  describe('sails.sockets.broadcast()', function (done){
    before(function(){
      sails.post('/socketMethods/broadcast', function(req, res){
        return res.send();
      });
    });
    it('should not crash', function (done){
      io.socket.post('/socketMethods/broadcast', function (data, jwr) {
        done();
      });
    });
  });




  describe('sails.sockets.emit()', function (done){
    before(function(){
      sails.post('/socketMethods/emit', function(req, res){
        return res.send();
      });
    });
    it('should not crash', function (done){
      io.socket.post('/socketMethods/emit', function (data, jwr) {
        done();
      });
    });
  });




  describe('sails.sockets.blast()', function (done){
    before(function(){
      sails.post('/socketMethods/blast', function(req, res){
        return res.send();
      });
    });
    it('should not crash', function (done){
      io.socket.post('/socketMethods/blast', function (data, jwr) {
        done();
      });
    });
  });


});

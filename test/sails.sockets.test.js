/**
 * Module dependencies
 */

var assert = require('assert');
var async = require('async');
var _ = require('lodash');

var ERRORPACK = require('../lib/errors');



describe('low-level socket methods:', function (){

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

    var idOfValidSocket;

    before(function(done){
      sails.get('/socketMethods/id/helper', function(req, res){
        idOfValidSocket = req.socket.id;
        return res.send();
      });
      io.socket.get('/socketMethods/id', function (data, jwr){ done(); });
    });

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
      assert.equal(sails.sockets.get(7), undefined);
      assert.equal(sails.sockets.get('7'), undefined);
    });

    it('should return a Socket when called w/ a socket id which points to a real socket', function (){
      var socket = sails.sockets.get(theKing.id);
      assert(socket, 'expected socket to exist');
      assert(_.isString(socket.id), 'expected socket to look like a real Socket');
      assert(_.isFunction(socket.emit), 'expected socket to look like a real Socket');
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

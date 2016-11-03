/**
 * Module dependencies
 */

var assert = require('assert');
var util = require('util');
var lifecycle = require('./helpers/lifecycle.helper');

describe('Using `onlyAllowOrigins`', function () {

  describe('With `onlyAllowOrigins: \'http://localhost.com\'`', function() {

    it('should fail to lift Sails (onlyAllowOrigins should be an array of strings)', function(done) {

      lifecycle.setup({
        sockets: {
          onlyAllowOrigins: 'http://localhost.com'
        }
      }, function(err) {
        if (err) {
          if (err.code === 'E_INVALID_ONLY_ALLOW_ORIGINS') {
            return done();
          }
          return done(new Error('Unknown error during lift: ' + util.inspect(err, {depth: null})));
        }
        global._sails.lower(function() {
          return done(new Error('Should not have been able to lift!'));
        });
      });

    });

  });


  describe('With `onlyAllowOrigins: [\'localboast.com\']`', function() {

    it('should fail to lift Sails (origins must contain a protocol)', function(done) {

      lifecycle.setup({
        sockets: {
          onlyAllowOrigins: ['localboast.com']
        }
      }, function(err) {
        if (err) {
          if (err.code === 'E_INVALID_ORIGIN') {
            return done();
          }
          return done(new Error('Unknown error during lift: ' + util.inspect(err, {depth: null})));
        }
        global._sails.lower(function() {
          return done(new Error('Should not have been able to lift!'));
        });
      });

    });

  });

  describe('With `onlyAllowOrigins: [\'http://localboast.com:80\']`', function() {

    it('should fail to lift Sails (origins on http should not explicitly use port 80)', function(done) {

      lifecycle.setup({
        sockets: {
          onlyAllowOrigins: ['http://localboast.com:80']
        }
      }, function(err) {
        if (err) {
          if (err.code === 'E_INVALID_ORIGIN') {
            return done();
          }
          return done(new Error('Unknown error during lift: ' + util.inspect(err, {depth: null})));
        }
        global._sails.lower(function() {
          return done(new Error('Should not have been able to lift!'));
        });
      });

    });

  });

  describe('With `onlyAllowOrigins: [\'https://localboast.com:443\']`', function() {

    it('should fail to lift Sails (origins on http should not explicitly use port 443)', function(done) {

      lifecycle.setup({
        sockets: {
          onlyAllowOrigins: ['https://localboast.com:443']
        }
      }, function(err) {
        if (err) {
          if (err.code === 'E_INVALID_ORIGIN') {
            return done();
          }
          return done(new Error('Unknown error during lift: ' + util.inspect(err, {depth: null})));
        }
        global._sails.lower(function() {
          return done(new Error('Should not have been able to lift!'));
        });
      });

    });

  });

  describe('With `onlyAllowOrigins: [\'http://localboast.com:1337\', \'http://snarkydoo.org:1492\']`', function() {

    var socket;

    before(function(done) {

      lifecycle.setup({
        log: {level: 'warn'},
        sockets: {
          onlyAllowOrigins: ['http://localboast.com:1337', 'http://snarkydoo.org:1492']
        }
      }, function(err) {
        if (err) {
          return done(err);
        }
        io.sails.autoConnect = false;
        return done();
      });

    });

    after(function(done) {
      lifecycle.teardown(done);
    });

    it('An attempt to connect from http://localboast.com:1337 should succeed', function(done) {

      socket = io.sails.connect('http://localhost:1577', {initialConnectionHeaders: {origin: 'http://localboast.com:1337'}});
      var timeout;
      socket.on('connect', function() {
        clearTimeout(timeout);
        socket.disconnect();
        return done();
      });
      timeout = setTimeout(function() {
        return done(new Error('Did not connect!'));
      }, 100);


    });

    it('An attempt to connect from http://snarkydoo.org:1492 should succeed', function(done) {

      socket = io.sails.connect('http://localhost:1577', {initialConnectionHeaders: {origin: 'http://snarkydoo.org:1492'}});
      var timeout;
      socket.on('connect', function() {
        clearTimeout(timeout);
        socket.disconnect();
        return done();
      });
      timeout = setTimeout(function() {
        return done(new Error('Did not connect!'));
      }, 100);

    });

    it('An attempt to connect from http://localboast.com:1492 should fail', function(done) {

      socket = io.sails.connect('http://localhost:1577', {initialConnectionHeaders: {origin: 'http://localboast.com:1492'}});
      var timeout;
      socket.on('connect', function() {
        clearTimeout(timeout);
        return done(new Error('Should not have connected!'));
      });
      socket.on('connect_error', function() {
        clearTimeout(timeout);
        return done();
      });
      timeout = setTimeout(function() {
        return done(new Error('Should have gotten connection error!'));
      }, 100);

    });

    it('An attempt to connect from http://snarkydoo.org:1337 should fail', function(done) {

      socket = io.sails.connect('http://localhost:1577', {initialConnectionHeaders: {origin: 'http://snarkydoo.org:1337'}});
      var timeout;
      socket.on('connect', function() {
        clearTimeout(timeout);
        return done(new Error('Should not have connected!'));
      });
      socket.on('connect_error', function() {
        clearTimeout(timeout);
        return done();
      });
      timeout = setTimeout(function() {
        return done(new Error('Should have gotten connection error!'));
      }, 100);

    });

    it('An attempt to connect from http://localboast.com should fail', function(done) {

      socket = io.sails.connect('http://localhost:1577', {initialConnectionHeaders: {origin: 'http://localboast.com'}});
      var timeout;
      socket.on('connect', function() {
        clearTimeout(timeout);
        return done(new Error('Should not have connected!'));
      });
      socket.on('connect_error', function() {
        clearTimeout(timeout);
        return done();
      });
      timeout = setTimeout(function() {
        return done(new Error('Should have gotten connection error!'));
      }, 100);

    });

    it('An attempt to connect from http://snarkydoo.org should fail', function(done) {

      socket = io.sails.connect('http://localhost:1577', {initialConnectionHeaders: {origin: 'http://snarkydoo.org'}});
      var timeout;
      socket.on('connect', function() {
        clearTimeout(timeout);
        return done(new Error('Should not have connected!'));
      });
      socket.on('connect_error', function() {
        clearTimeout(timeout);
        return done();
      });
      timeout = setTimeout(function() {
        return done(new Error('Should have gotten connection error!'));
      }, 100);

    });

    it('An attempt to connect from http://randomagee.com:1337 should fail', function(done) {

      socket = io.sails.connect('http://localhost:1577', {initialConnectionHeaders: {origin: 'http://randomagee.com:1337'}});
      var timeout;
      socket.on('connect', function() {
        clearTimeout(timeout);
        return done(new Error('Should not have connected!'));
      });
      socket.on('connect_error', function() {
        clearTimeout(timeout);
        return done();
      });
      timeout = setTimeout(function() {
        return done(new Error('Should have gotten connection error!'));
      }, 100);

    });


  });

});

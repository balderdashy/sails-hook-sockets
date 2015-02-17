/**
 * Module dependencies
 */

var _ = require('lodash');
var Urls = require('machinepack-urls');
var ERRORPACK = require('./errors');



module.exports = function ToConfigure(app) {


  return function configure (){

    // If one piece of the ssl config is specified, ensure the other required piece is there
    if (app.config.ssl){
      if (app.config.ssl.cert && !app.config.ssl.key) {
        throw ERRORPACK.CONFIG('Invalid SSL config object!  Must include cert and key!');
      }
      if (!app.config.ssl.cert && app.config.ssl.key) {
        throw ERRORPACK.CONFIG('Invalid SSL config object!  Must include cert and key!');
      }
    }

    // Deprecation messages

    // sails.config.sockets.adapter
    // =================================
    if (app.config.sockets.adapter === 'memory') {
      // `memory` is not actual the name of a real module
      app.config.sockets.adapter = null;
    }
    if (app.config.sockets.adapter === 'redis'){
      // If we see `redis`, change it to `socket.io-redis`.
      app.config.sockets.adapter = 'socket.io-redis';
      app.log.debug(
      'Deprecation warning: In Sails v0.11, Socket.io adapters are now installed '+
      'as direct dependencies of your Sails app.'+'\n'+
      'You are seeing this message because your Socket.io `adapter` configuration '+
      'is no longer supported.'+'\n'+
      'To resolve:\n'+
      '1) Figure out where you are setting your socket adapter configuration (usually this is `config/sockets.js`)'+'\n'+
      '2) Replace its current setting ("redis") with "socket.io-redis" (the name of the socket.io Redis adapter module)'+'\n'+
      '3) Install the Socket.io adapter for Redis:'+'\n'+
      '   npm install socket.io-redis@0.1.4 --save'+'\n'
      );
    }

    // Adapter options
    // =================================

    // If redis-specific options are supplied in `sails.config.sockets`,
    // move them to `adapterOptions` for backwards-compatibility.
    if (app.config.sockets.host) {
      app.config.sockets.adapterOptions.host = app.config.sockets.host;
    }
    if (app.config.sockets.port) {
      app.config.sockets.adapterOptions.port = app.config.sockets.port;
    }
    if (app.config.sockets.pass) {
      app.config.sockets.adapterOptions.pass = app.config.sockets.pass;
    }
    if (app.config.sockets.db) {
      app.config.sockets.adapterOptions.db = app.config.sockets.db;
    }
    if (app.config.sockets.pubClient) {
      app.config.sockets.adapterOptions.pubClient = app.config.sockets.pubClient;
    }
    if (app.config.sockets.subClient) {
      app.config.sockets.adapterOptions.subClient = app.config.sockets.subClient;
    }
    if (app.config.sockets.socket) {
      app.config.sockets.adapterOptions.socket = app.config.sockets.socket;
    }
    if (app.config.sockets.key) {
      app.config.sockets.adapterOptions.key = app.config.sockets.key;
    }

    // If redis url is specified, prefer it to the other options
    if (app.config.sockets.url||app.config.sockets.adapterOptions.url) {
      try {
        var parsedUrl = Urls.parse({
          url: app.config.sockets.url||app.config.sockets.adapterOptions.url
        }).execSync();
        app.config.sockets.adapterOptions.host = parsedUrl.hostname;
        app.config.sockets.adapterOptions.port = parsedUrl.port||0;
        app.config.sockets.adapterOptions.db = parsedUrl.auth.split(':')[0]||undefined;
        app.config.sockets.adapterOptions.pass = parsedUrl.auth.split(':')[1]||undefined;

      }
      catch (e){
        app.log.warn('Could not parse provided Redis url (`sails.config.sockets.url`):\n%s\nIgnnoring...', app.config.sockets.url||app.config.sockets.adapterOptions.url);
      }
    }



    // onConnect
    // =================================
    if (_.isFunction(app.config.sockets.onConnect)) {
      app.log.debug('Deprecation warning: Support for `sails.config.sockets.onConnect` will be removed in an upcoming release. See the v0.11 migration guide for more information and alternate options.');
    }

    // onDisconnect
    // =================================
    if (_.isFunction(app.config.sockets.onDisconnect)) {
      app.log.debug('Deprecation warning: `sails.config.sockets.onDisconnect` is now `sails.config.sockets.afterDisconnect`\n'+
      'Setting it for you this time, but note that the new `afterDisconnect` now receives an additional final argument (a callback).\n'+
      'More info: http://sailsjs.org/#/documentation/reference/sails.config/sails.config.sockets.html');
      if (_.isFunction(app.config.sockets.afterDisconnect)) {
        throw ERRORPACK.CONFIG('Cannot set both `onDisconnect` AND `afterDisconnect`!  Remove your configured `onDisconnect` function.');
      }
      app.config.sockets.afterDisconnect = function (session, socket, done){
        app.config.sockets.onDisconnect(session, socket);
        done();
      };
    }
    // afterDisconnect must be valid function
    if (app.config.sockets.afterDisconnect && typeof app.config.sockets.afterDisconnect !== 'function') {
      throw ERRORPACK.CONFIG('Invalid `sails.config.sockets.afterDisconnect`- must be a function.');
    }

    // allowRequest:
    // =================================
    if (_.isFunction(app.config.sockets.allowRequest)) {
      throw ERRORPACK.CONFIG('The `allowRequest` option from engine.io is not used by Sails.  Instead, use `beforeConnect` (it has the same function signature).');
    }

    // Authorization:
    // =================================
    if (!_.isUndefined(app.config.sockets.authorization)) {
      app.log.debug('Deprecation warning: `sails.config.sockets.authorization` is now `sails.config.sockets.beforeConnect` (setting it for you this time)');
      app.config.sockets.beforeConnect = app.config.sockets.authorization;
    }
    if (app.config.sockets.beforeConnect === false) {
      app.config.sockets.beforeConnect = undefined;
    }
    if (app.config.sockets.beforeConnect === true) {
      app.log.debug('Deprecation warning: `sails.config.sockets.beforeConnect` does not allow the `true` setting anymore (setting it to `undefined` for you this time)');
      app.config.sockets.beforeConnect = undefined;
    }

    if (app.config.sockets.beforeConnect && !_.isFunction(app.config.sockets.beforeConnect)) {
      throw ERRORPACK.CONFIG('Expected `sails.config.sockets.beforeConnect` to be a function');
    }

  };
};

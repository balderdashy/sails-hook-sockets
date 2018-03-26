/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var Urls = require('machinepack-urls');
var ERRORPACK = require('./errors');
var checkOriginUrl = require('./util/check-origin-url');
var flaverr = require('flaverr');



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
    else if (app.config.sockets.adapter === 'redis'){
      // If we see `redis`, change it to `socket.io-redis`.
      app.config.sockets.adapter = 'socket.io-redis';
      app.log.debug(
      'Deprecation warning: In Sails v1.0 and up (and since v0.11 actually) Socket.io adapters are installed '+
      'as direct dependencies of your Sails app.'+'\n'+
      'You are seeing this message because your Socket.io `adapter` configuration '+
      'is no longer supported.'+'\n'+
      'To resolve:\n'+
      '1) Figure out where you are setting your socket adapter configuration (usually this is `config/sockets.js`)'+'\n'+
      '2) Replace its current setting ("redis") with "socket.io-redis" (the name of the socket.io Redis adapter module)'+'\n'+
      '3) Install the Socket.io adapter for Redis:'+'\n'+
      '   npm install socket.io-redis --save --save-exact'+'\n'
      );
    }

    // config.sockets.onlyAllowOrigins must be an array.
    if (!_.isUndefined(app.config.sockets.onlyAllowOrigins) && !_.isArray(app.config.sockets.onlyAllowOrigins)) {
      throw flaverr('E_INVALID_ONLY_ALLOW_ORIGINS', new Error('If `sails.config.sockets.onlyAllowOrigins` is defined, it must be an array of origins.'));
    }

    // Warn if config.sockets.onlyAllowOrigins is not defined in production.
    if (_.isUndefined(app.config.sockets.onlyAllowOrigins) && _.isUndefined(app.config.sockets.beforeConnect) && process.env.NODE_ENV==='production') {
      throw new Error(
                      '\n-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-\n'+
                      'No `sails.config.sockets.onlyAllowOrigins` or `sails.config.sockets.beforeConnect`\n'+
                      'setting was detected.  For security reasons, one of these options must be set\n'+
                      'when running Sails in a production environment.\n'+
                      'For example (in config/env/production.js):\n\n'+
                      'sockets: {\n' +
                      '  onlyAllowOrigins: ["http://www.mydeployedapp.com", "http://mydeployedapp.com"]\n'+
                      '}\n\n'+
                      '-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-\n'
                     );
    }

    // Log a warning if both `beforeConnect` and `onlyAllowOrigins` are set, since the latter will be ignored.
    if (!_.isUndefined(app.config.sockets.onlyAllowOrigins) && !_.isUndefined(app.config.sockets.beforeConnect)) {
      app.log.debug('Warning: both `sails.config.sockets.onlyAllowOrigins` and `sails.config.sockets.beforeConnect`');
      app.log.debug('are set.  Ignoring the `onlyAllowOrigins` setting...');
      app.log.debug();
      // socket.io actually ignores this for us, but this future-proofs against that behavior changing
      // in the future.
      delete app.config.sockets.onlyAllowOrigins;
    }

    // Validate all origins in config.sockets.onlyAllowOrigins.
    if (_.isUndefined(app.config.sockets.beforeConnect) && _.isArray(app.config.sockets.onlyAllowOrigins)) {
      _.each(app.config.sockets.onlyAllowOrigins, function(origin) {
        checkOriginUrl(origin);
      });
      // In production, if the only allowed origins are on localhost, log a warning.
      if (process.env.NODE_ENV==='production' && _.all(app.config.sockets.onlyAllowOrigins, function(origin) {
        return origin.match(/https?\:\/\/localhost($|\:)/) || origin.match(/https?\:\/\/127\.0\.0\.1($|\:)*/);
      })) {
        app.log.debug('It looks like your `sails.config.sockets.onlyAllowOrigins` array only includes');
        app.log.debug('references to the `localhost` origin.  This is completely valid, but be sure');
        app.log.debug('to add any other origins to this list that you\'d like to accept socket');
        app.log.debug('connections from!');
        app.log.debug();
      }
    }


    // Adapter options
    // =================================

    // If redis-specific options are supplied in `sails.config.sockets`,
    // move them to `adapterOptions` for backwards-compatibility.
    _.each(['host', 'port', 'pass', 'db', 'pubClient', 'subClient', 'subEvent', 'socket', 'key', 'url'], function(adapterOptionKey) {
      if (app.config.sockets[adapterOptionKey]) {
        app.config.sockets.adapterOptions[adapterOptionKey] = app.config.sockets[adapterOptionKey];
      }
    });

    // If an admin pub client / sub client are provided, merge those into `adminAdapterOptions`.
    if (app.config.sockets.adminPubClient) {
      app.config.sockets.adminAdapterOptions.pubClient = app.config.sockets.adminPubClient;
    }
    if (app.config.sockets.adminSubClient) {
      app.config.sockets.adminAdapterOptions.subClient = app.config.sockets.adminSubClient;
    }

    // If redis url is specified, prefer it to the other options
    if (app.config.sockets.adapterOptions.url) {
      try {
        var parsedUrl = Urls.parse({
          url: app.config.sockets.adapterOptions.url
        }).execSync();
        app.config.sockets.adapterOptions.host = parsedUrl.hostname;
        app.config.sockets.adapterOptions.port = parsedUrl.port||0;
        app.config.sockets.adapterOptions.db = parseInt(parsedUrl.path.replace('/', '')) || 0;
        app.config.sockets.adapterOptions.user = parsedUrl.auth.split(':')[0]||undefined;
        app.config.sockets.adapterOptions.pass = parsedUrl.auth.split(':')[1]||undefined;

      }
      catch (e){
        app.log.warn('Could not parse provided Redis url (`sails.config.sockets.url`):\n%s\nIgnoring...', app.config.sockets.url||app.config.sockets.adapterOptions.url);
      }
    }

    if (app.config.sockets.adapterOptions.db) {
      // If `db` was supplied, validate the value.
      try {

        // Must be zero or a positive integer less than 1,000,000 (inclusive).
        var isInteger = (Math.floor(app.config.sockets.adapterOptions.db) === app.config.sockets.adapterOptions.db);
        if (!_.isNumber(app.config.sockets.adapterOptions.db)) {
          throw new Error('Must be a number -- but instead got: '+app.config.sockets.adapterOptions.db+' (a '+typeof app.config.sockets.adapterOptions.db+')');
        }
        if (!isInteger || app.config.sockets.adapterOptions.db < 0) {
          throw new Error('Must be an integer 0 or greater -- but instead got: '+app.config.sockets.adapterOptions.db);
        }

      } catch (e) {
        throw ERRORPACK.CONFIG('The configured value for sails.config.sockets.db (`'+app.config.sockets.adapterOptions.db+'`) is invalid: '+e.message);
      }
      // --•
      // IWMIH, it's good to go.
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
      'More info: http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.sockets.html');
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

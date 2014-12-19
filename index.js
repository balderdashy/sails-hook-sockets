/**
 * Module dependencies
 */

var _ = require('lodash');
var ERRORPACK = require('./lib/errors');




/**
 * `sockets` hook
 */

module.exports = function (app){
  return {

    defaults: require('./lib/defaults'),

    configure: function (){

      // If one piece of the ssl config is specified, ensure the other required piece is there
      if (app.config.ssl && (
          app.config.ssl.cert && !app.config.ssl.key
        ) || (!app.config.ssl.cert && app.config.ssl.key)) {
        throw new Error('Invalid SSL config object!  Must include cert and key!');
      }

      // Deprecation messages

      // onConnect
      // =================================
      if (_.isFunction(app.config.sockets.onConnect)) {
        app.log.warn('`sails.config.sockets.onConnect` has been deprecated, and support will be removed in an upcoming release. See the v0.11 migration guide for more information.');
      }

      // onDisconnect
      // =================================
      if (!_.isFunction(app.config.sockets.afterDisconnect) && app.config.sockets.onDisconnect) {
        app.config.sockets.afterDisconnect = function (session, socket, cb){
          app.log.debug('Deprecation warning: `sails.config.sockets.onDisconnect` is now `sails.config.sockets.afterDisconnect`\n'+
          'Setting it for you this time, but note that the new `afterDisconnect` now receives an additional final argument (a callback).\n'+
          'More info: http://sailsjs.org/#/documentation/reference/sails.config/sails.config.sockets.html');
          app.config.sockets.onDisconnect(session, socket);
          cb();
        };
      }
      // afterDisconnect must be valid function
      if (app.config.sockets.afterDisconnect && typeof app.config.sockets.afterDisconnect !== 'function') {
        throw new Error('Invalid `sails.config.sockets.afterDisconnect`- must be a function.');
      }

      // allowRequest:
      // =================================
      if (_.isFunction(app.config.sockets.allowRequest)) {
        throw new Error('The `allowRequest` option from engine.io is not used by Sails.  Instead, use `beforeConnect` (it has the same function signature).');
      }

      // Authorization:
      // =================================
      if (!_.isUndefined(app.config.sockets.authorization)) {
        app.log.warn('Deprecation warning: `sails.config.sockets.authorization` is now `sails.config.sockets.beforeConnect` (setting it for you this time)');
        app.config.sockets.beforeConnect = app.config.sockets.authorization;
      }
      if (app.config.sockets.beforeConnect === false) {
        app.config.sockets.beforeConnect = undefined;
      }
      if (app.config.sockets.beforeConnect === true) {
        app.log.warn('Deprecation warning: `sails.config.sockets.beforeConnect` does not allow the `true` setting anymore (setting it to `undefined` for you this time)');
        app.config.sockets.beforeConnect = undefined;
      }

      if (app.config.sockets.beforeConnect && !_.isFunction(app.config.sockets.beforeConnect)) {
        throw ERRORPACK.CONFIG('Expected `sails.config.sockets.beforeConnect` to be a function');
      }

    },

    initialize: require('./lib/initialize')(app),

    routes: {

      // Before the app's routes...
      before: {

      },

      // After the app's routes (i.e. if none matched)...
      after: {

        // This "shadow" route can be disabled by setting:
        // `sails.config.sockets.grant3rdPartyCookie: false`
        'GET /__getcookie': function (req, res, next) {
          if (!sails.config.sockets.grant3rdPartyCookie) {
            return next();
          }
          res.send('_sailsIoJSConnect();');
        }

      }
    }

  };
};






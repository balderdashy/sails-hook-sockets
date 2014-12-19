/**
 * Module dependencies
 */

var ERRORPACK = require('./lib/errors');




/**
 * `sockets` hook
 */

module.exports = function (app){
  return {

    defaults: require('./lib/defaults'),

    configure: function (){

      // onConnect must be valid function
      if (app.config.sockets.onConnect && typeof app.config.sockets.onConnect !== 'function') {
        throw new Error('Invalid `sails.config.sockets.onConnect` Must be a function.');
      }

      // If one piece of the ssl config is specified, ensure the other required piece is there
      if (app.config.ssl && (
          app.config.ssl.cert && !app.config.ssl.key
        ) || (!app.config.ssl.cert && app.config.ssl.key)) {
        throw new Error('Invalid SSL config object!  Must include cert and key!');
      }

      // Deprecation message
      if (app.config.sockets.authorization) {
        app.log.debug('Deprecation warning: `sails.config.authorization` is now `sails.config.allowRequest` (setting it for you this time)');
        app.config.sockets.allowRequest = app.config.sockets.authorization;
      }
      if (app.config.sockets.allowRequest === false) {
        app.config.sockets.allowRequest = undefined;
      }
      if (app.config.sockets.allowRequest === true) {
        app.log.debug('Deprecation warning: `sails.config.allowRequest` does not allow the `true` setting anymore (setting it to `undefined` for you this time)');
        app.config.sockets.allowRequest = undefined;
      }

      if (app.config.sockets.allowRequest && !_.isFunction(app.config.sockets.allowRequest)) {
        throw ERRORPACK.CONFIG('Expected `sails.config.sockets.allowRequest` to be a function');
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






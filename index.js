/**
 * `sockets` hook
 */

module.exports = function (app){
  return {

    defaults: require('./lib/defaults'),

    initialize: require('./lib/initialize')(app),

    routes: {

      // Before the app's routes...
      before: {

        'all /*': function addOriginHeader(req, res, next) {
          if (req.isSocket) {
            // TODO: pull this out - doesn't need to be here
            req.headers = req.headers || {};
            req.headers.origin = req.socket.handshake && req.socket.handshake.headers && req.socket.handshake.headers.origin;
          }
          return next();
        }

      },

      // After the app's routes (i.e. if none matched)...
      after: {

        // This shadow route can be disabled by setting:
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






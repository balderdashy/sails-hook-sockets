/**
 * `sockets` hook
 */

module.exports = function (app){
  return {

    defaults: require('./lib/defaults'),

    configure: require('./lib/configure')(app),

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
          if (!app.config.sockets.grant3rdPartyCookie) {
            return next();
          }
          res.send('_sailsIoJSConnect();');
        }

      }
    }

  };
};






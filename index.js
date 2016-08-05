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
          // We explicitly set Content-Type to javascript, because some servers
          // require this when the header X-Content-Type-Options is set to
          // 'nosniff'
          res.set('Content-Type', 'application/javascript');
          res.send('_sailsIoJSConnect();');
        }

      }
    },

    // Default no-op admin bus
    broadcastAdminMessage: function() {},
    blastAdminMessage: function() {}

  };
};

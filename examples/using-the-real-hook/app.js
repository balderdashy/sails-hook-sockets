/**
 * Module dependencies
 */

var Sails = require('sails').Sails;


// Load up a quick sails app to serve static files
// (and be our friendly neighborhood HTTP server)
var app = Sails();
app.lift({
  globals: false,
  log: { level: 'silent' },
  paths: {
    public: __dirname
  },
  hooks: {
    sockets: require('../..')
  },
  loadHooks: ['moduleloader', 'userconfig', 'http', 'sockets']
}, function (err){
  if (err) {
    console.error('Encountered error while trying to lift Sails:', err);
    return;
  }

  console.log('Sails lifted successfully.');
});

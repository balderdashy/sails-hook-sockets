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
    stubsockets: require('./hook')
  },
  loadHooks: ['moduleloader', 'userconfig', 'http', 'stubsockets']
}, function (err){
  if (err) {
    console.error('Encountered error while trying to lift Sails:', err);
    return;
  }

  console.log('Sails lifted successfully.');

  console.log('View example at http://localhost:1337/sandbox.html');
});

/**
 * Module dependencies
 */

var Path = require('path');
var async = require('async');
var _ = require('lodash');
var Sails = require('sails').Sails;
var Filesystem = require('machinepack-fs');


// Load up a quick sails app to serve static files
// (and be our friendly neighborhood HTTP server)
var app = Sails();
app.lift({
  globals: false,
  log: { level: 'silent' },
  routes: {

    /**
     * Grab the sails.io.js client from `node_modules/` and template it into the sandbox.html page,
     * then serve that rendered HTML.
     */
    'get /': function (req, res) {

      async.auto({

        sailsIOClient: function (next){
          Filesystem.read({
            source: Path.resolve(__dirname,'../../node_modules/sails.io.js/sails.io.js')
          }).exec(next);
        },

        exampleHtml: function (next){
          Filesystem.read({
            source: Path.resolve(__dirname,'./sandbox.html')
          }).exec(next);
        }
      }, function (err, results) {
        if (err) {
          console.error(err);
          return res.send('An error occured: see terminal.');
        }

        var renderedHtml = _.template(results.exampleHtml, {
          sdk: results.sailsIOClient
        });

        return res.send(renderedHtml);

      });
    }

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

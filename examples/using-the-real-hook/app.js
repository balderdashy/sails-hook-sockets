/**
 * Module dependencies
 */

var Path = require('path');
var async = require('async');
var _ = require('@sailshq/lodash');
var Sails = require('sails').Sails;
var Filesystem = require('machinepack-fs');


var app = Sails();
app.lift({
  globals: false,
  log: { level: 'silly' },
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
    },


    /**
     * Dumb test route
     */
    'post /chickens/roost': function (req, res) {
      return res.send('the chickens came home');
    }

  },
  hooks: {
    sockets: require('../..')
  },
  loadHooks: ['moduleloader', 'userconfig', 'http', 'sockets', 'session']
}, function (err){
  if (err) {
    console.error('Encountered error while trying to lift Sails:', err);
    return;
  }

  console.log('Sails lifted successfully.');
  console.log('View example at http://localhost:1337/');
});

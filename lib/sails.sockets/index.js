/**
 * Module dependencies
 */

var _ = require('lodash');




module.exports = function ToBuildSocketsMethods(app) {

  // Build `sails.sockets` object
  var sailsSockets = {};

  // Set DEFAULT_EVENT_NAME constant for use in the methods defined below
  sailsSockets.DEFAULT_EVENT_NAME = 'message';

  // Now, build and configure each of its methods:
  sailsSockets.blast = require('./blast-to-all')(app);
  sailsSockets.join = require('./join-room')(app);
  sailsSockets.leave = require('./leave-room')(app);
  sailsSockets.broadcast = require('./broadcast-to-room')(app);
  sailsSockets.emit = require('./emit-to-sockets')(app);
  sailsSockets.get = require('./get-socket-by-id')(app);
  sailsSockets.rooms = require('./list-all-rooms')(app);
  sailsSockets.socketRooms = require('./list-rooms-joined-by-socket')(app);
  sailsSockets.subscribers = require('./list-room-members')(app);
  sailsSockets.id = require('./parse-socket-id')(app);
  sailsSockets.parseSocket = require('./parse-socket')(app);

  // No-op the firehose
  sailsSockets.publishToFirehose = function() {};

  // (note that the names of some of these may still change to be more obvious--
  //  hence this hook still being stability level 3)

  return sailsSockets;
};

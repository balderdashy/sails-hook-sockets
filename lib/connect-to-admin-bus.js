/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var _ = require('lodash');
var ERRORPACK = require('./errors');
var uid2 = require('uid2');

module.exports = function (app) {

  var prepareDriver = require('./prepare-driver')(app);

  // Create a unique key for this server, so we can tell when we're receiving
  // our own broadcasts.
  var uid = uid2(6);

  return function connectToAdminBus(adapterDef, cb){

    // Indicate that this connection is for the admin bus
    adapterDef.adminBus = true;

    // Prepare the driver for the admin bus (e.g. Redis).  This may create client
    // connections to the pub/sub store, if they weren't already created and
    // passed in as `adminAdapterOptions.pubClient` and `adminAdapterOptions.subClient`.
    prepareDriver(adapterDef, function(err) {
      if (err) {return cb(err);}

      // If we're using Redis, set up a pub/sub channel exclusively for the admin bus.
      if (adapterDef.moduleName == 'socket.io-redis') {

        // All other socket messages will use the default / namespace, so by naming
        // our channel with the "sails" namespace we make sure there are no collisions
        var channel = adapterDef.config.key || 'socket.io' + '#sails#';

        // Subscribe our pub/sub client to the channel
        return adapterDef.config.subClient.subscribe(channel, function(err) {
          if (err) {return cb(err);}

          // Event handler for receiving messages on the channel
          adapterDef.config.subClient.on('message', function(messageChannel, buffer) {

            if (messageChannel.toString() !== channel) {
              app.log.warn('Ignoring a message received on the Sails admin bus for a channel other than the bus channel.');
              app.log.warn('Are you by chance re-using the main adapter pub/sub clients for the admin bus?');
              app.log.warn('Channel: ' + messageChannel + ' Message: ' + buffer.toString());
              return;
            }

            // Attempt to JSON parse the message
            try {
              var msg = JSON.parse(buffer.toString());
              // Skip message if we can tell it came from us (broadcast)
              if (msg.uid === uid) {return;}
              // Handle the message content appropriately
              handleAdminMessage(msg);
            }
            // If it could not be parsed, log an error and bail
            catch(e) {
              app.log.error('Received a message on the Sails admin bus that could not be parsed as JSON: ', buffer.toString());
              app.log.error('Are you by chance re-using the main adapter pub/sub clients for the admin bus?');

            }
          });

          // Override the default broadcastAdminMessage to send a message on the Redis channel
          app.hooks.sockets.broadcastAdminMessage = function(event, payload) {
            // Include our server's uid so that when we receive the message above,
            // we'll ignore it.
            var msg = JSON.stringify({
              uid: uid,
              event: event,
              payload: payload
            });
            adapterDef.config.pubClient.publish(channel, msg);
          };

          // Override the default blastAdminMessage to send a message on the Redis channel
          app.hooks.sockets.blastAdminMessage = function(event, payload) {
            // Don't include our server's uid so that when we receive the message above,
            // we'll handle it like any other
            var msg = JSON.stringify({
              event: event,
              payload: payload
            });
            adapterDef.config.pubClient.publish(channel, msg);
          };
          return cb();
        });
      }

      // Not using a multi-server setup?  Just return.
      return cb();
    });

  };

  // Handle messages from the bus appropriately
  function handleAdminMessage(msg) {

    // Empty message?  Just return.
    if (!msg) {return;}

    // If the message has an "event" and "payload", examine it further
    if (msg.event && msg.payload) {

      switch(msg.event) {

        // "join" events get forwarded to addRoomMembersToRooms
        case 'join':
          app.sockets.addRoomMembersToRooms.apply({remote: true}, [msg.payload.sourceRoom, msg.payload.destRooms]);
          break;

        // "leave" events get forwarded to removeRoomMembersFromRooms
        case 'leave':
          app.sockets.removeRoomMembersFromRooms.apply({remote: true}, [msg.payload.sourceRoom, msg.payload.destRooms]);
          break;

        // "leaveAll" events get forwarded to leaveAll
        case 'leaveAll':
          app.sockets.leaveAll.apply({remote: true}, [msg.payload.sourceRoom]);
          break;

        default:
          break;
      }
    }

    // Emit an event in the app in case someone else is interested.
    app.emit("hook:sockets:adminMessage", msg);

  }

};

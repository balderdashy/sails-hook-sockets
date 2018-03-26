/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var _ = require('@sailshq/lodash');
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
    adapterDef.config.pubClientName = 'admin pub';
    adapterDef.config.subClientName = 'admin sub';

    // Prepare the driver for the admin bus (e.g. Redis).  This may create client
    // connections to the pub/sub store, if they weren't already created and
    // passed in as `adminAdapterOptions.pubClient` and `adminAdapterOptions.subClient`.
    prepareDriver(adapterDef, function(err) {
      if (err) {return cb(err);}

      // If we're using Redis, then it means we must have a multi-server deployment.
      // Not using a multi-server setup?  Just bail.
      if (adapterDef.moduleName !== 'socket.io-redis' && adapterDef.moduleName !== '@sailshq/socket.io-redis') {
        return cb();
      }//--•

      // Otherwise we must be using redis.
      // In that case, we'll set up a pub/sub channel exclusively for the admin bus.

      // All other socket messages will use the default / namespace, so by naming
      // our channel with the "sails" namespace we make sure there are no collisions
      var channel = adapterDef.config.key || 'socket.io' + '#sails#';

      // Subscribe our pub/sub client to the channel
      adapterDef.config.subClient.subscribe(channel, function(err) {
        if (err) { return cb(err); }


        //  ┌┐ ┬┌┐┌┌┬┐  ┌─┐┌┐┌╔╦╗╔═╗╔═╗╔═╗╔═╗╔═╗╔═╗  ┌─┐┬  ┬┌─┐┌┐┌┌┬┐
        //  ├┴┐││││ ││  │ ││││║║║║╣ ╚═╗╚═╗╠═╣║ ╦║╣   ├┤ └┐┌┘├┤ │││ │
        //  └─┘┴┘└┘─┴┘  └─┘┘└┘╩ ╩╚═╝╚═╝╚═╝╩ ╩╚═╝╚═╝  └─┘ └┘ └─┘┘└┘ ┴ooo
        //  ┌─    ┌─┐┬─┐┌─┐┌┬┐  ┬─┐┌─┐┌┬┐┬┌─┐  ╔═╗╦ ╦╔╗   ┌─┐┬  ┬┌─┐┌┐┌┌┬┐    ─┐
        //  │───  ├┤ ├┬┘│ ││││  ├┬┘├┤  │││└─┐  ╚═╗║ ║╠╩╗  │  │  │├┤ │││ │   ───│
        //  └─    └  ┴└─└─┘┴ ┴  ┴└─└─┘─┴┘┴└─┘  ╚═╝╚═╝╚═╝  └─┘┴─┘┴└─┘┘└┘ ┴     ─┘
        // Bind event handler for receiving messages on the channel
        adapterDef.config.subClient.on('message', function(messageChannel, buffer) {

          if (messageChannel.toString() !== channel) {
            app.log.warn('Ignoring a message received on the Sails admin bus for a channel other than the bus channel.');
            app.log.warn('Are you by chance re-using the main adapter pub/sub clients for the admin bus?');
            app.log.warn('Channel: ' + messageChannel + ' Message: ' + buffer.toString());
            return;
          }

          var rawMsg;
          try {

            // Interpret bytes as a string.
            rawMsg = buffer.toString();

            // Attempt to JSON parse the message
            var parsedMsg;
            try {
              parsedMsg = JSON.parse(rawMsg);
            } catch(e) {
              // If it could not be parsed, log an error and bail
              app.log.error('Received a message on the Sails admin bus that could not be parsed as JSON: ', rawMsg);
              app.log.error('Are you by chance re-using the main adapter pub/sub clients for the admin bus?');
              return;
            }

            // Skip message if we can tell it came from us (broadcast)
            if (parsedMsg.uid === uid) { return; }

            // Now appropriately handle the content of this message from the bus.

            // Falsy message?  Just return.
            //                   TODO: ^^ why?  Doesn't seem like this should ever happen.
            if (!parsedMsg) { return; }

            // If the message has an "event" and "payload", examine it further
            if (parsedMsg.event && parsedMsg.payload) {

              switch(parsedMsg.event) {

                // "join" events get forwarded to addRoomMembersToRooms
                case 'join':
                  app.sockets.addRoomMembersToRooms.apply({remote: true}, [parsedMsg.payload.sourceRoom, parsedMsg.payload.destRooms]);
                  break;

                // "leave" events get forwarded to removeRoomMembersFromRooms
                case 'leave':
                  app.sockets.removeRoomMembersFromRooms.apply({remote: true}, [parsedMsg.payload.sourceRoom, parsedMsg.payload.destRooms]);
                  break;

                // "leaveAll" events get forwarded to leaveAll
                case 'leaveAll':
                  app.sockets.leaveAll.apply({remote: true}, [parsedMsg.payload.sourceRoom]);
                  break;

                default:
                  break;
              }
            }

            // Emit an event in the app in case someone else is interested.
            app.emit('hook:sockets:adminMessage', parsedMsg);

          } catch (e) {
            app.log.error('An unexpected error occurred when attempting to react to the message received on the Sails admin bus.\nRaw message received:\n'+util.inspect(rawMsg, {depth:null})+'\nError: '+e.stack);
            return;
          }
        });//</on:: message>


        //  ┌─┐┬  ┬┌─┐┬─┐┬─┐┬┌┬┐┌─┐  ┌┐ ┬─┐┌─┐┌─┐┌┬┐┌─┐┌─┐┌─┐┌┬┐┌─┐┌┬┐┌┬┐┬┌┐┌┌┬┐┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐
        //  │ │└┐┌┘├┤ ├┬┘├┬┘│ ││├┤   ├┴┐├┬┘│ │├─┤ │││  ├─┤└─┐ │ ├─┤ ││││││││││││├┤ └─┐└─┐├─┤│ ┬├┤
        //  └─┘ └┘ └─┘┴└─┴└─┴─┴┘└─┘  └─┘┴└─└─┘┴ ┴─┴┘└─┘┴ ┴└─┘ ┴ ┴ ┴─┴┘┴ ┴┴┘└┘┴ ┴└─┘└─┘└─┘┴ ┴└─┘└─┘
        // Override the default broadcastAdminMessage to send a message on the Redis channel
        app.hooks.sockets.broadcastAdminMessage = function(event, payload) {
          // Include our server's uid so that when we receive the message above,
          // we'll ignore it.
          var stringifiedMsg = JSON.stringify({
            uid: uid,
            event: event,
            payload: payload
          });
          adapterDef.config.pubClient.publish(channel, stringifiedMsg);
        };

        //  ┌─┐┬  ┬┌─┐┬─┐┬─┐┬┌┬┐┌─┐  ┌┐ ┬  ┌─┐┌─┐┌┬┐┌─┐┌┬┐┌┬┐┬┌┐┌┌┬┐┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐
        //  │ │└┐┌┘├┤ ├┬┘├┬┘│ ││├┤   ├┴┐│  ├─┤└─┐ │ ├─┤ ││││││││││││├┤ └─┐└─┐├─┤│ ┬├┤
        //  └─┘ └┘ └─┘┴└─┴└─┴─┴┘└─┘  └─┘┴─┘┴ ┴└─┘ ┴ ┴ ┴─┴┘┴ ┴┴┘└┘┴ ┴└─┘└─┘└─┘┴ ┴└─┘└─┘
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


        // All done.
        return cb();

      });//</subClient.subscribe()>

    });//</prepareDriver()>

  };//</fn declaration :: connectToAdminBus>

};//</wrapper fn that provides `app`>

/**
 * Module dependencies
 */

var ToReceiveIncomingSailsIOMsg = require('./receive-incoming-sails-io-msg');


module.exports = function ToHandleNewConnection(app){

  // Set the environment for `receiveIncomingSailsIOMsg`
  var receiveIncomingSailsIOMsg = ToReceiveIncomingSailsIOMsg(app);

  return function onConnect (socket){


    // Run `onConnect` lifecycle event
    if (app.config.sockets.onConnect) {
      if (!app.session) {
        app.config.sockets.onConnect({}, socket);
      }
      else {

        // TODO: try to get sid from socket.handshake.headers.cookie
        var sid = undefined;

        // Load session
        app.session.get(sid, function sessionReady (err, session) {
          // If an error occurred loading the session, log what happened
          if (err) {
            app.log.error('Could not run `sails.config.sockets.onConnect()`');
            app.log.error('(session could not be loaded)');
            app.log.error(err);
            return;
          }
          // Otherwise, run lifecycle event
          app.config.sockets.onConnect(session||{}, socket);
        });
      }
    }


    // Bind socket request handlers
    // (supports sails.io clients 0.9 and up)
    (function (bindSocketRequestHandler){
      bindSocketRequestHandler('get');
      bindSocketRequestHandler('post');
      bindSocketRequestHandler('put');
      bindSocketRequestHandler('delete');
      bindSocketRequestHandler('patch');
      bindSocketRequestHandler('options');
      bindSocketRequestHandler('head');
    })(function receiveMessage(eventName){
      socket.on(eventName, function (incomingSailsIOMsg, socketIOClientCallback){
        receiveIncomingSailsIOMsg({
          incomingSailsIOMsg: incomingSailsIOMsg,
          socketIOClientCallback: socketIOClientCallback,
          eventName: eventName,
          socket: socket
        });
      });
    });

    // Bind disconnect handler
    socket.on('disconnect', function onSocketDisconnect(){

      // Configurable custom onDisconnect logic here
      // (default: do nothing)
      if (app.config.sockets.onDisconnect) {
        if (!app.session) {
          app.config.sockets.onDisconnect({}, socket);
        }
        else {
          // TODO: try to get sid from socket.handshake.headers.cookie
          var sid = undefined;

          // Load session
          app.session.get(sid, function sessionReady (err, session) {
            // If an error occurred loading the session, log what happened
            if (err) {
              app.log.error('Could not run `sails.config.sockets.onConnect()`');
              app.log.error('(session could not be loaded)');
              app.log.error(err);
              return;
            }
            // Otherwise, run lifecycle event
            app.config.sockets.onDisconnect(session||{}, socket);
          });
        }
      }
    }); //</onSocketDisconnect>
  }; //</onSocketConnect>
};

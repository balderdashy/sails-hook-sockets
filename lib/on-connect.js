/**
 * Module dependencies
 */

var ToReceiveIncomingSailsIOMsg = require('./receive-incoming-sails-io-msg');
var loadSessionFromSocket = require('./load-session-from-socket');


module.exports = function ToHandleNewConnection(app){

  // Set the environment for `receiveIncomingSailsIOMsg`
  var receiveIncomingSailsIOMsg = ToReceiveIncomingSailsIOMsg(app);

  return function onConnect (socket){


    // Run `onConnect` lifecycle event
    (function runOnConnectListener(){
      if (!app.config.sockets.onConnect) return;

      app.log.warn('`sails.config.sockets.onConnect` has been deprecated, and support will be removed in an upcoming release. See the v0.11 migration guide for more information.');
      app.log.warn('(running it for you this time)');

      loadSessionFromSocket(socket.handshake, app, function finishedLoading(err, session, sessionId){
        // If an error occurred loading the session, log what happened
        if (err) {
          app.log.warn('A socket connected, but the session could not be loaded to pass to configured handler: `sails.config.sockets.onConnect()`.  Will run handler with a fake, empty session.  Details:\n',err);
          session = {};
        }
        // Then run lifecycle callback
        app.config.sockets.onConnect(session, socket);
      });
    })();


    // Bind disconnect handler
    socket.on('disconnect', function onSocketDisconnect(){

      // Configurable custom afterDisconnect logic here
      // (default: do nothing)
      if (!app.config.sockets.afterDisconnect) return;

      loadSessionFromSocket(socket.handshake, app, function finishedLoading(err, session, sessionId){
        // If an error occurred loading the session, log what happened
        if (err) {
          app.log.warn('Socket disconnected, but session could not be loaded to pass to configured disconnect handler: `sails.config.sockets.onDisconnect()`.  Will pass a fake, empty session as argument to lifecycle callback.  Details:\n',err);
          session = {};
          sessionId = undefined;
        }

        // Then run lifecycle callback
        app.config.sockets.afterDisconnect(session, socket, function (err) {
          if (err) {
            app.log.error('Error in `sails.config.sockets.afterDisconnect` lifecycle callback:',err);
            return;
          }

          // Save the session if necessary/possible
          if (!app.session || !sessionId) return;
          app.session.set(sessionId, session, function (err){
            if (err) {
              app.log.error('Error saving session in `sails.config.sockets.afterDisconnect`:',err);
              return;
            }
          });
        });

      }); //</loadSessionFromSocket>

    }); //</onSocketDisconnect>


    // Bind socket request handlers
    (function bindRequestHandlersForMajorHttpMethods(bindSocketRequestHandler){
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
    }); // </bindRequestHandlersForMajorHttpMethods>

  }; //</onSocketConnect>
};

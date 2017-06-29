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
      if (!app.config.sockets.afterDisconnect) {
        return;
      }

      loadSessionFromSocket(socket.handshake, app, function finishedLoading(err, session, sessionId){
        // If an error occurred loading the session, log what happened
        if (err) {
          app.log.warn('Socket disconnected, but session could not be loaded to pass to configured disconnect handler: `sails.config.sockets.afterDisconnect()`.  Will pass a fake, empty session as argument to lifecycle callback.  Details:\n',err);
          session = {};
          sessionId = undefined;
        }

        // Run the configured `beforeConnect` function (either synchronously or asynchronously)
        // and handle the result.
        (function (handleAfterDisconnectResult) {
          // Run the custom authorization logic.
          try {
            // If the logic is a Node async function, attach a `.catch()` to handle rejections.
            if (app.config.sockets.afterDisconnect.constructor.name === 'AsyncFunction') {
              var promise = app.config.sockets.afterDisconnect(session, socket, handleAfterDisconnectResult);
              // If `afterDisconnect` throws an error, we'll take that as a rejection of the connection.
              // Although we'd much rather it just call its callback than throw an error!
              promise.catch(function(err){
                // Socket.io expects the first argument (if any) of the callback to be a string.
                app.log.error('Error in `sails.config.sockets.afterDisconnect` lifecycle callback:',err);
              });
            }
            // Otherwise just run the synchronous function.
            else {
              app.config.sockets.afterDisconnect(session, socket, handleAfterDisconnectResult);
            }
          } catch (e) {
            app.log.error('Error in `sails.config.sockets.afterDisconnect` lifecycle callback:',e);
          }
        })(function afterDisconnectResultHandler(err) {
          if (err) {
            app.log.error('Error in `sails.config.sockets.afterDisconnect` lifecycle callback:',err);
            return;
          }

          // Save the session if necessary/possible
          if (!app.session || !sessionId) {
            return;
          }
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

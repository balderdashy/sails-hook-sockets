/**
 * Module dependencies
 */

var _ = require('lodash');




module.exports = function (app){


  /**
   * Broadcast a message to a room
   *
   * If the event name is omitted, "message" will be used by default.
   * Thus, sails.sockets.broadcast(roomName, data, [socketToOmit]) is also a valid usage.
   *
   * @param  {string|array} roomNames Names of one or more rooms to broadcast a message to
   * @param  {string} eventName    The event name to broadcast
   * @param  {object} data     The data to broadcast
   * @param  {object} socketToOmit   Optional socket to omit
   */

  return function broadcastToRoom (roomNames, eventName, data, socketToOmit) {

    // If this was called via .emit() or .emitToAll(), show a warning
    if (this.usingDeprecatedFnName) {
      app.log.debug('sails.sockets.' + this.usingDeprecatedFnName +'() is deprecated; use sails.sockets.broadcast() (see `http://sailsjs.org/documentation/concepts/upgrading/to-v-0-12`)');
    }

    // If the 'eventName' is an object, assume the argument was omitted and
    // parse it as data instead.
    if (typeof eventName === 'object') {
      data = eventName;
      socketToOmit = data;
      eventName = null;
    }

    // Default to `sails.sockets.DEFAULT_EVENT_NAME`
    if (!eventName) {
      eventName = app.sockets.DEFAULT_EVENT_NAME;
    }

    // Try to get a socket out of the "socketToOmit" argument.  If we were
    // passed a socket or a request object with a socket in it, this will
    // return a socket object.  Otherwise it will return undefined.
    socketToOmit = app.sockets.parseSocket(socketToOmit);

    // Var to hold the event emitter we'll use to send the broadcast
    var emitter;

    // If we were given a valid socket to omit, "broadcast" using that socket
    // so that it will not receive the message.
    if (socketToOmit) {
      emitter = socketToOmit.broadcast;
    }
    // Otherwise emit to all sockets in the default namespace
    else {
      emitter = app.io.sockets;
    }

    // Make sure roomNames is an array
    if (!_.isArray(roomNames)) {
      roomNames = [roomNames];
    }

    // Tell the emitter each room to emit to
    _.each(roomNames, function(roomName) {
      emitter.in(roomName);
    });

    // Send the broadcast
    emitter.emit(eventName, data);

  };

};

/**
 * Module dependencies
 */

var _ = require('lodash');
var ERRORPACK = require('../errors');




module.exports = function (app){

  /**
   * Emit a message to one socket by ID
   *
   * If the event name is omitted, "message" will be used by default.
   * Thus, sails.sockets.emit(socketIDs, data) is also a valid usage.
   *
   * @param  {string} socketID The ID of a socket to send a message to
   * @param  {string} event     The name of the message to send
   * @param  {object} data      Optional data to send with the message
   *
   * @returns {object} dictionary mapping socket IDs to success/failure of sending message to that socket
   */
  return function emitToSocket (socketID, eventName, data) {

    if (_.isArray(socketID)) {
      app.log.warn("Sending an array of socket IDs to `sails.sockets.emit()` is deprecated.  Please use `sails.sockets.emitToAll()` instead.");
      return app.sockets.emitToAll(socketID, eventName, data);
    }

    if (typeof eventName === 'object') {
      data = eventName;
      eventName = null;
    }

    if (!eventName) {
      eventName = app.sockets.DEFAULT_EVENT_NAME;
    }

    if (_.isObject(socketID)){
      socket = app.sockets.parseSocket(socketID);
      socketID = app.sockets.id(socketID);
    }

    try {
      app.sockets.get(socketID).emit(eventName, data);
    } catch(e) {
      if (e.code == 'SAILS:HOOK:SOCKETS:NO_SUCH_SOCKET') {
        throw ERRORPACK.NO_SUCH_SOCKET('The socket ID (%s) you are trying to emit from does not exist.', socketID);
      }
      throw e;
    }

  };
};

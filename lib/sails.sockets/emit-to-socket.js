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
   * @param  {string} eventName     The name of the message to send
   * @param  {object} data      Optional data to send with the message
   *
   * @returns {object} dictionary mapping socket IDs to success/failure of sending message to that socket
   */
  return function emitToSocket (socketID, eventName, data) {

    app.log.debug('sails.sockets.emit() is deprecated.  Use sails.sockets.broadcast() instead (see `http://sailsjs.org/documentation/concepts/upgrading/to-v-0-12`)');
    return app.sockets.broadcast(socketID, eventName, data);

  };
};

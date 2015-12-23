/**
 * Module dependencies
 */

var _ = require('lodash');
var ERRORPACK = require('../errors');




module.exports = function (app){

  /**
   * Emit a message to one or more sockets by ID
   *
   * If the event name is omitted, "message" will be used by default.
   * Thus, sails.sockets.emit(socketIDs, data) is also a valid usage.
   *
   * @param  {array|string} socketIDs The ID or IDs of sockets to send a message to
   * @param  {string} event     The name of the message to send
   * @param  {object} data      Optional data to send with the message
   *
   * @returns {object} dictionary mapping socket IDs to success/failure of sending message to that socket
   */
  return function emitToAll (socketIDs, eventName, data) {
    if (!_.isArray(socketIDs)) {
      socketIDs = [socketIDs];
    }

    // If socket instances were supplied, coerce to ids to be flexible.
    socketIDs = _.map(socketIDs, function (socket){
      if (_.isObject(socket)){
        socket = app.sockets.parseSocket(socket);
        return app.sockets.id(socket);
      }
      return socket;
    });


    if (typeof eventName === 'object') {
      data = eventName;
      eventName = null;
    }

    if (!eventName) {
      eventName = app.sockets.DEFAULT_EVENT_NAME;
    }

    return _.reduce(socketIDs, function(memo, socketID) {
      try {
        app.sockets.get(socketID).emit(eventName, data);
        memo[socketID] = true;
      } catch (e) {
        memo[socketID] = false;
      }
      return memo;
    }, {});
  };
};

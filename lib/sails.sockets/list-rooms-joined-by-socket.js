/**
 * Module dependencies
 */

var _ = require('lodash');




module.exports = function (app){

  /**
   * Get the list of rooms a socket is subscribed to
   * @param  {object} socket The socket to get rooms for
   * @return {array} An array of room names
   */
  return function listRoomsJoinedBySocket (socket) {
    return _.map(_.keys(app.io.sockets.manager.roomClients[socket.id]), function(roomName) {
      return roomName.replace(/^\//, '');
    });
  };
};

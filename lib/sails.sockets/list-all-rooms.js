/**
 * Module dependencies
 */

var _ = require('lodash');




module.exports = function (app){


  /**
   * Get the list of all rooms
   * @return {array} An array of room names, minus the empty room
   */
  return function listAllRooms() {
    var rooms = _.clone(app.io.sockets.manager.rooms);
    delete rooms[''];
    return _.map(_.keys(rooms), function(room) {
      return room.substr(1);
    });
  };
};

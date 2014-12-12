/**
 * `sockets` hook
 */

module.exports = function (app){
  return {

    defaults: require('./lib/defaults'),

    initialize: require('./lib/initialize')(app)

  };
};






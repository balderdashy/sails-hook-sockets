module.exports = {

  sockets: {


    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Sails-specific configuration options:
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    // Whether to include response headers in the JWR originated for
    // each socket request (e.g. `io.socket.get()` in the browser)
    // This doesn't affect direct socket.io usage-- only if you're
    // communicating with Sails via the request interpreter
    // (e.g. the sails.io.js browser SDK)
    sendResponseHeaders: true,

    // Whether to include the status code in the JWR originated for
    // each socket request (e.g. `io.socket.get()` in the browser)
    // This doesn't affect direct socket.io usage-- only if you're
    // communicating with Sails via the request interpreter
    // (e.g. the sails.io.js browser SDK)
    sendStatusCode: true,

    // Whether to run code which supports legacy usage for connected
    // sockets running the v0.9 version of the socket client SDK (i.e. sails.io.js).
    // Disabled in newly generated projects, but enabled as an implicit default.
    'backwardsCompatibilityFor0.9SocketClients': true,

    // Whether to expose a 'get /__getcookie' route with CORS support
    // that sets a cookie (this is used by the sails.io.js socket client
    // to get access to a 3rd party cookie and to enable sessions).
    //
    // Warning: Currently in this scenario, CORS settings apply to interpreted
    // requests sent via a socket.io connetion that used this cookie to connect,
    // even for non-browser clients! (e.g. iOS apps, toasters, node.js unit tests)
    grant3rdPartyCookie: true,

    // Default  behavior is a noop
    // Code to run when a new socket connects
    onConnect: function(session, socket) {},

    // Default behavior is a noop
    // Code to run when a socket disconnects
    onDisconnect: function(session, socket) {},



    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Raw configuration options exposed from Socket.io:
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *


    // The entry point where Socket.IO starts looking for incoming connections.
    // This should be the same between the client and the server.
    path: '/socket.io',




    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Raw configuration options exposed from engine.io:
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    // (source: https://github.com/Automattic/engine.io#methods-1)
    //
    // • pingTimeout (Number): how many ms without a pong packet to consider the connection closed (60000)
    // • pingInterval (Number): how many ms before sending a new ping packet (25000)
    // • maxHttpBufferSize (Number): how many bytes or characters a message can be when polling, before closing the session (to avoid DoS). Default value is 10E7.
    // • allowRequest (Function): A function that receives a given handshake or upgrade request as its first parameter, and can decide whether to continue or not. The second argument is a function that needs to be called with the decided information: fn(err, success), where success is a boolean value where false means that the request is rejected, and err is an error code.
    // • transports (<Array> String): transports to allow connections to (['polling', 'websocket'])
    // • allowUpgrades (Boolean): whether to allow transport upgrades (true)
    // • cookie (String|Boolean): name of the HTTP cookie that contains the client sid to send as part of handshake response headers. Set to false to not send one. (io)



    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Deprecated config:
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    ////////////////////////////////////////////////////////////////////////////////
    // Authorization has been deprecated in favor of middleware.
    // See http://socket.io/docs/migrating-from-0-9/#authentication-differences
    ////////////////////////////////////////////////////////////////////////////////
    // authorization: false,
    ////////////////////////////////////////////////////////////////////////////////


    ////////////////////////////////////////////////////////////////////////////////
    // Socket.io now has a true adapter system
    // (e.g. https://github.com/Automattic/socket.io-redis)
    ////////////////////////////////////////////////////////////////////////////////
    // store: undefined,
    // adapter: undefined,
    ////////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////////
    // Socket.io's built-in log is no more- uses the debug module now.
    // See: http://socket.io/docs/migrating-from-0-9/#log-differences
    ////////////////////////////////////////////////////////////////////////////////
    // logger: undefined,
    // 'log level': undefined,
    // 'log colors': undefined,
    ////////////////////////////////////////////////////////////////////////////////


    ////////////////////////////////////////////////////////////////////////////////
    // Auto-serving of the socket.io client is disabled in the v0.11 `sockets` hook.
    ////////////////////////////////////////////////////////////////////////////////
    // *static: undefined,
    ////////////////////////////////////////////////////////////////////////////////


    ////////////////////////////////////////////////////////////////////////////////
    // The `resource` configuration option is now "path", and works slightly differently.
    // (see http://socket.io/docs/migrating-from-0-9/#configuration-differences)
    ////////////////////////////////////////////////////////////////////////////////
    // *resource: '/socket.io'
    ////////////////////////////////////////////////////////////////////////////////


    ////////////////////////////////////////////////////////////////////////////////
    // Engine.io now has its own configuration (see above)
    // encapsulating the following legacy config options:
    ////////////////////////////////////////////////////////////////////////////////
    // // A array of allowed transport methods which the clients will try to use.
    // // The flashsocket transport is disabled by default
    // // You can enable flashsockets by adding 'flashsocket' to this list:
    // transports: [
    //   'websocket',
    //   'htmlfile',
    //   'xhr-polling',
    //   'jsonp-polling'
    // ],

    // // Match string representing the origins that are allowed to connect to the Socket.IO server
    // origins: '*:*',

    // // Should we use heartbeats to check the health of Socket.IO connections?
    // heartbeats: true,

    // // When client closes connection, the # of seconds to wait before attempting a reconnect.
    // // This value is sent to the client after a successful handshake.
    // 'close timeout': 60,

    // // The # of seconds between heartbeats sent from the client to the server
    // // This value is sent to the client after a successful handshake.
    // 'heartbeat timeout': 60,

    // // The max # of seconds to wait for an expcted heartbeat before declaring the pipe broken
    // // This number should be less than the `heartbeat timeout`
    // 'heartbeat interval': 25,

    // // The maximum duration of one HTTP poll-
    // // if it exceeds this limit it will be closed.
    // 'polling duration': 20,

    // // Enable the flash policy server if the flashsocket transport is enabled
    // 'flash policy server': false,

    // // By default the Socket.IO client will check port 10843 on your server
    // // to see if flashsocket connections are allowed.
    // // The Adobe Flash Player normally uses 843 as default port,
    // // but Socket.io defaults to a non root port (10843) by default
    // //
    // // If you are using a hosting provider that doesn't allow you to start servers
    // // other than on port 80 or the provided port, and you still want to support flashsockets
    // // you can set the `flash policy port` to -1
    // 'flash policy port': 10843,

    // // Used by the HTTP transports. The Socket.IO server buffers HTTP request bodies up to this limit.
    // // This limit is not applied to websocket or flashsockets.
    // 'destroy buffer size': '10E7',

    // // Do we need to destroy non-socket.io upgrade requests?
    // 'destroy upgrade': true,

    // // Does Socket.IO need to serve the static resources like socket.io.js and WebSocketMain.swf etc.
    // 'browser client': true,

    // // Cache the Socket.IO file generation in the memory of the process
    // // to speed up the serving of the static files.
    // 'browser client cache': true,

    // // Does Socket.IO need to send a minified build of the static client script?
    // 'browser client minification': false,

    // // Does Socket.IO need to send an ETag header for the static requests?
    // 'browser client etag': false,

    // // Adds a Cache-Control: private, x-gzip-ok="", max-age=31536000 header to static requests,
    // // but only if the file is requested with a version number like /socket.io/socket.io.v0.9.9.js.
    // 'browser client expires': 315360000,

    // // Does Socket.IO need to GZIP the static files?
    // // This process is only done once and the computed output is stored in memory.
    // // So we don't have to spawn a gzip process for each request.
    // 'browser client gzip': false,

    // // A function that should serve all static handling, including socket.io.js et al.
    // 'browser client handler': false,

    // // Meant to be used when running socket.io behind a proxy.
    // // Should be set to true when you want the location handshake to match the protocol of the origin.
    // // This fixes issues with terminating the SSL in front of Node
    // // and forcing location to think it's wss instead of ws.
    // 'match origin protocol': false,
    ////////////////////////////////////////////////////////////////////////////////
  }
};

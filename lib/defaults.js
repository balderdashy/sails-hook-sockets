module.exports = {

  sockets: {

    // To test this hook w/ a local redis, uncomment this line
    // adapter: '@sailshq/socket.io-redis',

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Socket.io adapter options
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    adapterOptions: {

      // e.g. in redis:
      // key: the name of the key to pub/sub events on as prefix (socket.io)
      // host: host to connect to redis on (localhost)
      // port: port to connect to redis on (6379)
      // socket: unix domain socket to connect to redis ("/tmp/redis.sock"). Will be used instead of the host and port options if specified.
      // pubClient: optional, the redis client to publish events on
      // subClient: optional, the redis client to subscribe to events on
    },

    adminAdapterOptions: {

    },


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

    // Whether to expose a 'get /__getcookie' route with CORS support
    // that sets a cookie (this is used by the sails.io.js socket client
    // to get access to a 3rd party cookie and to enable sessions).
    grant3rdPartyCookie: true,



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
    //
    // (source: https://github.com/Automattic/engine.io#methods-1)
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    // • serveClient (Boolean)
    //
    // whether or not the `socket.io.js` client should be automatically served at the conventional URL
    serveClient: false,


    // • pingTimeout (Number)
    //
    // how many ms without a pong packet to consider the connection closed (60000)
    pingTimeout: 60000,


    // • pingInterval (Number)
    //
    // how many ms before sending a new ping packet (25000)
    pingInterval: 25000,

    // • maxHttpBufferSize (Number)
    //
    // how many bytes or characters a message can be when polling, before closing the session (to avoid DoS). Default value is 10E7.
    maxHttpBufferSize: 10E7,


    // • beforeConnect (Function)
    //
    // A function that receives a given handshake or upgrade request as its first parameter, and can decide whether to continue or not.
    // The second argument is a function that needs to be called with the decided information: fn(err, success), where success is a boolean value
    // where false means that the request is rejected, and err is an error code.
    // Under the covers, this maps to the `allowRequest` option from socket.io.
    //
    // beforeConnect: function (handshakeOrUpgradeRequest, cb){
    //   cb(null, true);
    // },


    // • transports (<Array> String)
    //
    // transports to allow connections to (e.g. ['polling', 'websocket'])
    transports: [
      'websocket'
    ],


    // • allowUpgrades (Boolean)
    //
    // whether to allow transport upgrades (true)
    allowUpgrades: true,


    // • cookie (String|Boolean)
    //
    // name of the HTTP cookie that contains the client sid (sic - this refers to the **socket.io Socket id**,
    // not any kind of session id ~mike) to send as part of handshake response headers.
    // Set to false to not send one. (normally defaults to "io"- but in Sails we've disabled it for enhanced
    // security)
    cookie: false,


    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Deprecated config:
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    ////////////////////////////////////////////////////////////////////////////////
    // Authorization has been deprecated in favor of the `beforeConnect` lifecycle
    // callback from engine.io. (note that socket.io middleware also works, but is
    // not currently exposed by Sails, since it's duplicative given the infrastructure
    // already provided out of the box by the Sails router.  If you need sio middleware,
    // for some reason, let Mike know on twitter.)
    //
    // Traditional `authorization` config will be upgraded on-the-fly when you lift
    // your app, and a deprecation message will be shown.
    //
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
    // Auto-serving of the socket.io client is disabled by default in the v0.11
    // `sockets` hook.  Set `serveClient` to true if you need it.
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

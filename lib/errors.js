module.exports = require('../standalone/create-errorpack')({

  namespace: 'sails:hook:sockets',

  errors: {
    'USAGE': {},

    'CONFIG': {},

    'DEPENDS_ON_HOOK': {
      expected: 'another required hook to exist'
    },

    'SIO_ADAPTER_MODULE_NOT_FOUND': {
      description: 'could not find the configured Socket.io adapter module in your app\'s `node_modules/` folder'
    },

    'REQUIRE_SOCKETIO_ADAPTER': {
      description: 'miscellaneous error requiring the configured Socket.io adapter'
    },

    'PARSE_VIRTUAL_REQ': {
      status: 400,
      expected: 'incoming socket message to be parseable as a virtual request usable in the Sails core router'
    },

    'NO_SUCH_SOCKET': {
      status: 404,
      expected: 'to find a socket',
    },

    'NO_SUCH_NAMESPACE': {
      expected: 'to find a Socket.io namespace named "/"'
        // NOTE:
        // This error should currently never occur, but the definition
        // may need to be expanded if/when we add support for multiple
        // Socket.io namespaces in future releases of this hook.
        // ~mike Sun Dec 21, 2014
    },
  }
});

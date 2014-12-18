module.exports = require('../standalone/create-errorpack')({
  namespace: 'sails:hook:sockets',
  errors: {
    'USAGE': {},
    'CONFIG': {},
    'HOOK_DEPENDENCY': {},
    'PARSE_MESSAGE': { status: 400 },
    'NO_SUCH_SOCKET': { status: 404 },
  }
});

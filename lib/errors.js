module.exports = require('../standalone/create-errorpack')({
  namespace: 'sails:hook:sockets',
  errors: {
    'USAGE': {},
    'HOOK_DEPENDENCY': {},
    'PARSE_MESSAGE': { status: 400 }
  }
});

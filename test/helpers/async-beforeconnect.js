module.exports = async function(handshake, cb) {
  if (handshake._query.status === 'error') {
    throw new Error('err!');
  }
  try {
    await dumb(handshake._query.status);
    return cb(undefined, true);
  } catch (e) {
    return cb('failed', false);
  }
};

// Define a dumb async function.
var dumb = function (status) {
  return new Promise(function (resolve, reject) {
    setTimeout(function() {
      if (status === 'ok') {
        return resolve();
      }
      if (status === 'reject') {
        return reject();
      }
    }, 100);
  });
};


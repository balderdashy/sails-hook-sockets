module.exports = async function(handshake, cb) {
  if (handshake._query.status === 'error') {
    throw new Error('err!');
  }
  try {
    await dumb(handshake._query.status);
    return cb();
  } catch (e) {
    return cb('failed', false);
  }
};

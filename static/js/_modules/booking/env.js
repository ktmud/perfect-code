var env = {
  debug: false
};

env.getVariant = function(name) {
  if (name in booking.jst) {
    return booking.jst[name];
  }
  return false;
};

module.exports = env;

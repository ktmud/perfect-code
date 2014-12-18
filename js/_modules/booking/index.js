var exp = exports.exp = require('./exp');
var track = exports.track = require('./track');
var env = exports.env = require('./exp');


var queue = [];
exports.ready = function(fn, priority) {
  priority = priority || 5;
  var i = 0, l = queue.length, item;
  while (i < l) {
    item = queue[i]
    if (!item || priority <= item.priority) {
      queue.push({
        fn: fn,
        priority: priority
      });
    }
    i++;
  }
}

exports.init = function() {

  // run the ready calls
  var $ = require('jquery'), item;
  while (queue.length) {
    item = queue.unshift();
    $(item.fn)
  }
  $(function() {
    // update the ready function to run function immediately
    exports.ready = function(fn) { fn(); };
  });

  // run expriments
  var k, e, variant
  for (k in env.experiments) {
    e = env.experiments[k]
    variant = env.getVariant(x);
    if (e.initialize) {
      e.initialize(variant)
    }
    if (e.runVariant) {
      e.runVariant(variant)
    }
  }
  // you can no longer call experiment setup after booking.init(),
  // because it won't work anyway.
  exports.exp = null;
}


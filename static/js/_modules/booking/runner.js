/* vim: set expandtab : */
module.exports = init;

var env = require('./env');
var queue = [];
var namedRunners = {};

/**
 * Usage:
 *
 * booking.setup({ name: 'abc', depends: 'foo' }, function() {
 * })
 *
 */
init.setup = function(obj, fn) {
	switch (typeof obj) {
		case 'number':
			obj = fn || {};
			obj.priority = obj;
			break;
		case 'string':
			obj = fn || {};
			obj.name = obj;
			break;
		case 'function':
			obj = { fn: obj };
			break;
	}
  obj.priority = obj.priority || 5;
	obj.on = obj.on || 'ready'; // trigger point, can be `fly`, `load`, `ready`
	obj.dependencies = [].concat(obj.deps);
	obj.dependants = [];

	var name = obj.name;
	if (name) {
		if (name in namedRunners) {
			throw new Error('Already defined runner: ' + name);
		}
		namedRunners[name] = obj;
	}

  var i = 0, l = queue.length, item;
  while (i <= l) {
    item = queue[i];
    if (!item || item.priority > obj.priority) {
			// insert the runner to proper position
      queue.splice(i, 0, obj);
			break;
    }
    i++;
  }
	return obj;
};

/**
 * Execute a runner
 */
function execute(runner) {
	var variant = runner.variant = env.getVariant(runner.name);
	var fn = runner.fn;
	var vFn = runner['v' + variant];

	// has both variant function and base function,
	// make variant function include the base function
	if (vFn && fn) {
		fn = function(done) {
			if (runner.fn.length) {
				runner.fn(function() {
					vFn.call(this, done);
				});
			} else {
				runner.fn();
				vFn.call(this, done);
			}
		};
	}

	if (!fn.length) {
		fn.call(runner);
		done.call(runner);
	} else {
		// fn is async, with signature `function (done) { }`
		fn.call(runner, function() {
			done.call(runner);
		});
	}

	function done() {
		// notify dependants we are done.
		if (runner.dependants.length) {
			$.each(runner.dependants, function(i, dependant) {
				remove(dependant.dependencies, runner.name);
				// all dependency resolved
				if (!dependant.dependencies.length) {
					execute(dependant);
				}
			});
		}
	}
}

function remove(arr, item) {
	for (var i in arr) {
		if (arr[i] === item) {
			arr.splice(i, 1);
			break;
		}
	}
}

/**
 * resolve dependencies of each module
 */
function markDependants() {
	$.each(function(i, item) {
		$.each(item.deps, function(i, mod) {
			if (!namedRunners.hasOwnProperty(mod)) {
				throw new Error('Can\'t find depended runner: ' + mod);
			}
			namedRunners[mod].dependants.push(item);
		});
	});
}

function init() {

	var $ = require('jquery');
	var win = $(window);

	markDependants();

	$.each(queue, function(i, item) {
		if (item.on === 'fly') {
			execute(item);
		} else if (item.on === 'load') {
			win.bind('load', function() {
				execute(item);
			});
		} else {
			// default to DOMReady
			$(function() {
				execute(item);
			});
		}
	});

  // you can no longer do setup after booking.init(),
  // because it won't work anyway.
	queue = null;
  exports.setup = null;
}

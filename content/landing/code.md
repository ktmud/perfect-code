---
date: 2014-12-17T23:05:58+01:00
title: The "Pefect" Code
slug: code

---

## Directory Structure

```
static/
└── js/
    ├── _modules/
    │   ├── booking/
    │   │   ├── env.js
    │   │   ├── exp.js
    │   │   ├── index.js
    │   │   └── track.js
    │   │   └── translate.js
    │   │   └── jstmpl.js
    │   │   └── ga.js
    │   ├── bui/
    │   │   ├── dropdown.js
    │   │   ├── form/
    │   │   │   └── validator.js
    │   │   └── lightbox.js
    │   ├── essentials/
    │   │   └── debug.js
    │   ├── fetch.js
    │   ├── require.js
    │   ├── require2.js
    │   └── ~jyang2/
    │       └── lightbox2.js
    ├── landingpages/
    │   ├── b.js
    │   ├── c.js
    │   └── exp_a.js
    └── main/
        ├── 0.modules.js
        └── z.initialize.js
```

## Modules

Example file: `main/0.modules.js`

```javascript
<TMPL_INLINE _modules/require.js>
<TMPL_INLINE _modules/fetch.js>

<TMPL_JS_MODULE booking/index>
<TMPL_JS_MODULE booking/env>
<TMPL_JS_MODULE booking/exp>
<TMPL_JS_MODULE booking/track>
<TMPL_JS_MODULE booking/ga>

<TMPL_JS_MODULE ~jyang2/lightbox2>

// exports the booking global for easier usage
window.booking = require('booking')


// run initializers, bind DOMReady events
booking.init();
```

`TMPL_JS_MODULE` will wrap the file in CommonJS style.

For file `static/js/_modules/booking/index.js`:

```javascript
exports.exp = require('./exp');
// ... blah blah
```

A call of:

```javascript
<TMPL_JS_MODULE booking/exp>
```

Will be replaced with:

```javascript
require.register('booking/exp', function(exports, require, module) {

exports.exp = require('booking/exp');
// ... blah blah

});
```

- File path as module name
- Must omit suffix
- relative path in `require()` were converted to absolute path (for statical analysis)
- If required a directory, will use `directory/index.js`

### Statical Analysis?

Suppose we have multiple script tags in one page.

```markup
<script src="http://bstatic.jyang-app.dev.booking.com/main.js">
<script src="http://bstatic.jyang-app.dev.booking.com/landingpages.js">
```

And both file have included the same module `_modules/bui/lightbox.js`.

When handling the request, server can analysis these JS files by simple grepping `require(.*)`,
so to find out the duplicate includes, and give developer warnings.


## booking.(...)

### booking.ready

A proxy to $.ready with priority support.
An alternative to sNSStartup.

```javascript
booking.ready(5, function() {
});

// Can also be named
booking.ready({ priority: 5, name: 'haha' }, function() {
})
// later
booking.ready({ depends: ['abc'] }, function() {
})
// with throw error if dependency has not been registered
// so you have to at least name your dependency
```


### booking.exp

As simple as:

```javascript
var env = require('booking/env');

module.exports = function exp(name) {
  var expriment = {
    name: name,
    hash: name  // add alias
  };
  env.expriments[name] = expriment;
  return experiment;
};
```

Example usage:

```javascript
// file: static/js/landingpages/exp_lp_something_need_lightbox.js

(function() {

var booking = require('booking');
var Lightbox = require('bui/lightbox')

var exp = booking.exp('<TMPL_VAR b_expriment_hash_lp_something_need_lightbox');

// initialization setup for Base/Variants
exp.initialize = function(variant) {
	if (variant != false) {
		// only do this when experiment stopped?
		booking.track.custom_goal(this.name, 1);
	}
};

exp.runVariant = function(variant) {
  var box = new Lightbox();
  if (variant == 2) {
    box.setOption('xxx', true);
  }
};

})();
```

Cleanup:

```javascript
(function() {

var booking = require('booking');
var Lightbox = require('bui/lightbox')

booking.ready(function(variant) {
  var box = new Lightbox();
  if (variant == 2) {
    box.setOption('xxx', true);
  }
});

})();
```


When initialize:

```javascript
// _modules/booking/index.js
var env = require('booking/env');

exports.init = function() {
  // run the initializers added by (booking.ready)
  var $ = require('jquery'), item;
  while (queue.length) {
    item = queue.unshift();
    $(item.fn);
  }
  $(function() {
		queue = null;
    // update the ready function to run function immediately
    exports.ready = function(fn) { fn(); };
  });

  // run expriments
  var k, e, variant;
  for (k in env.experiments) {
    e = env.experiments[k];
    variant = env.getVariant(x);
    if (e.initialize) {
      e.initialize(variant);
    }
    if (e.runVariant) {
      e.runVariant(variant);
    }
  }
  // you can no longer call experiment setup after booking.init(),
  // because it won't work anyway.
  exports.exp = null;
};
```


### booking.mediator

Global events center.

```
exports.subscribe = function() {
}
exports.publish = function() {
}
```


## BUI

Booking UI Components with conventions.

### base.js

A boilterplate class, to provide conventions.

An extentable class with standard methods about events/templates/$dom.

```javascript
	function Base(options) {
		if (!$.isPlainObject(options)) {
			options = { el: options }
		}
		this.options = options = $.extend(true, {}, this.constructor.DEFAULTS, options)
		this.templates = options.templates;
		this.init();
	}
	// to have `on`, `off`, `emit` method.
	__extend(Base, EventEmitter);

	Base.DEFAULTS = {
		templates: {}
	}

	Base.prototype.init = function() {
		// assign $el
		var self = this, $el = $(self.options.el)
		// script tag content is treated as template for el
		if ($el[0].tagName == 'SCRIPT') {
			$el = $($.trim($el.html()))
		}
		self.$el = $el
		self.el = $el[0]
		// delegate click events within component context
		self.$el.delegate('[data-action]', 'click', function(e) {
			var data = $(this).data()
			if (typeof self[data.action] == 'function') {
				self[data.action](data)
				e.preventDefault()
			} else {
				throw new Error('Unknown action: ' + data.action)
			}
		})
	}

	// ... many more

	Base.prototype.destroy = function() {
		this.emit('destroy')
		this.$el.remove()
		this.destroyed = true
	}

	Base.prototype.$ = function(query) {
		return this.$el.find(query)
	}
```

For `bui/index.js`

```javascript
var Base = require('bui/base');

exports.cohere = function extends(Component) {
  return __extend(Component, Base)
};
```

Example component, `bui/lightbox.js`:

```javascript
function Lightbox() {
  Lightbox.__super__.apply(this, arguments);
}
bui.cohere(Lightbox);

Lightbox.prototype.doSomething = function() {
  this.emit('event');  // emit "event" on the instance itself
  this.publish('event'); // publish a global event "lightbox:event"
};
```

Why not

```javascript
var Lightbox = BUIBase.extends({
  doSomething: function() {
  }
})
```

1. Constructor function will have a reasonable name (easier for debug)
2. Less indentations
3. Clearer indication of class methods vs instance methods.


## Essentials

events, iterators, debug, DOM utility, templates...

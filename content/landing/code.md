---
date: 2014-12-17T23:05:58+01:00
title: The "Pefect" Code
slug: code

---

## Directory Structure

See [presentation](https://www.evernote.com/l/AD4CCiM7bXRNw7HOaV9HpB7W4Tu3jkbVH8w).

```
static/
└── js
    ├── _modules
    │   ├── booking
    │   │   ├── env.js
    │   │   ├── exp.js
    │   │   ├── index.js
    │   │   └── track.js
    │   ├── bui
    │   │   ├── dropdown.js
    │   │   ├── form
    │   │   │   └── validator.js
    │   │   └── lightbox.js
    │   ├── essentials            [1]
    │   │   ├── class.js
    │   │   ├── debug.js
    │   │   ├── eventEmitter.js
    │   │   └── promise.js
    │   ├── fetch.js
    │   ├── require.js
    │   ├── require2.js
    │   ├── vendor
    │   │   └── jquery.js
    │   └── ~jyang2               [2]
    │       └── lightbox2.js
    ├── landingpages              [3]
    │   ├── b.js
    │   ├── c.js
    │   └── exp_a.js
    └── main
        ├── 0.modules.js
        └── z.initialize.js
```

1. `booking` is modules only validate within Booking.com context, like tracking, translation, client side HTMLTemplate, env variable management, experiment setup, and how do we initialize things.
`essentials` are more generic things, which are often replaceable with community solutions.
2. `~username` are modules not mature enough for sharing. Should be moved into `bui` when stable.
3. Things in `_modules` will not concat into one file. You must inline/include them.

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

For file [static/js/_modules/booking/index.js](https://github.com/ktmud/perfect-code/blob/gh-pages/js/_modules/booking/index.js):

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

A toolkit to support our business.

### booking.setup

Setup startup_run and experiments.

```javascript
booking.setup(function() {
});

// Can also be named
booking.setup('haha', {
	priority: 5,
	fn: function() {
	}
});
booking.setup({
	depends: ['abc'],
	on: 'load'  // change on DOMReady to onload
	fn: function() {
	}
});

// can even be async
booking.setup({
	depends: ['abc'],
	fn: function(done) {
		$.getJSON('/axxx', function() {
			// init this thing after data loaded from JSON.
			done();
		})
	}
});

// will throw error if dependency not been registered
// so you have to and only need to name your dependency
```

For experiments:

```javascript
// file: static/js/landingpages/exp_lp_something_need_lightbox.js

(function() {

var booking = require('booking');
var Lightbox = require('bui/lightbox')

var box;

booking.setup({
	name: '<TMPL_VAR b_expriment_hash_lp_something_need_lightbox>'
	depends: ['ab', 'c']
	// initialization for all Base/Variants, optional
	fn: function initialization(variant) {
		var hash = this.name;
		$('body').delegate('.something', 'click', function() {
			booking.track.custom_goal(this.name, 1);
		});
	},
	// base
	v0: function() {
	},
	v1: function() {
		box = new Lightbox();
	},
	v2: function() {
		this.v1();
		box.setOption('xxx', true);
	}
});

})();
```

[Behind the curtain](https://github.com/ktmud/perfect-code/blob/master/static/js/_modules/booking/runner.js).


This code snippet is not defined as a module, because no need to.
Why give it a name if nobody will "require" it?
It's where we define experiments, an endpoint of using modules.
The real functionality has already been abstracted into a reusable module.

For the same reason, we also don't write module methods onto the `exp` context,
except the shared init code amongst variants.

Every experiment feature is translated into some kind of component api,
using `options.xxx` or `.enableXXX()`, or data attributes / class names
on the elements, which doesn't matter.

#### Cleanup

Move variants code into `fn`

```javascript
(function() {

var booking = require('booking');
var Lightbox = require('bui/lightbox')

booking.setup({
	depends: ['ab', 'c']
	// initialization for all Base/Variants, optional
	fn: function initialization(variant) {
		box = new Lightbox();
		box.setOption('xxx', true);
	}
});


})();
```

When fail, delete the file as we do it now.
The extra options/methods we added to the UI component can stay there,
the same feature may be reused at somewhere else anyway.

When wrote with event hooks and/or methods override, it
should be pretty easy to clean things up too.

The cleanup should never be something trivial, you are supposed
to constantly refactor & improve your code.



### booking.mediator

Global events center.

```
exports.subscribe = function() {
}
exports.publish = function() {
}
```

### Summary

The basic toolkit about Booking business (experiments, tracking, etc...)
should not limit our ways of organizing the code.
It'd better work both on desktop and mobile, traditional pages and web apps.
So it's very important to keep it minimal and environment agnostic.

So data-attributes, promises, HTMLTemplate compiling in JS would all be too advanced and unnecessary.

If we can already make the code clean and maitainable with good old plain JS, why introduce many new concepts/styles?

Sugar is nothing more than sugar. Be careful with decayed teeth.

Globals are not necessarily evil, the "untraceable" variables. Globals are considered bad because you can easily loose track of it, never be sure about who provided it. If we agree nobody will
ever override `window`, `booking`, I don't see the necessity of not using it.


## BUI

Booking UI Components with conventions.

### base.js

A boilterplate class, to provide conventions. Inspired by Backbone and CoffeeScript/ES6 Class.

An extentable class with standard methods about events/templates/$dom.
Not necessarily the recommended way for everyone.

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

/**
 * Render a given section based on `options.templates`
 * only render one section at a time.
 *
 * @return {string|HTMLElement|jQuery}
 */
Base.prototype.compose = function(sect, data) {
	if (!(sect in this.templates)) {
		throw new Error('No template for: ' + sect);
	}
	if ('function' == typeof this.templates[sect]) {
		return this.templates[sect](data)
	}
	return this.templates[sect]
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

Although they are recommended ways, everything here should still be replaceable.

One task one module, you must mannually "inline" or "include" when you need it.

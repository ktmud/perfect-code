---
date: 2014-12-17T23:05:58+01:00
title: The "Pefect" Code
slug: code

---

## Directory Structure

```
static/
└── js
    ├── _modules
    │   ├── booking
    │   │   ├── env.js
    │   │   ├── exp.js
    │   │   ├── index.js
    │   │   ├── mediator.js
    │   │   └── track.js
    │   │   ├── z.js
    │   ├── bui
    │   │   ├── base.js
    │   │   ├── dropdown.js
    │   │   └── lightbox.js
    │   ├── essentials
    │   │   ├── class.js
    │   │   ├── debug.js
    │   │   ├── eventEmitter.js
    │   │   ├── lang.js
    │   │   ├── dom.js
    │   ├── fetch.js
    │   ├── require.js
    │   ├── require2.js
    │   └── ~jyang2
    │       └── lightbox2.js
    ├── landingpages
    │   ├── b.js
    │   ├── c.js
    │   └── exp_a.js
    └── main
        ├── 0.modules.js
        └── z.initialize.js
```

## Modules

Example file: `main/0.modules.js`

```javascript
<TMPL_INLINE _modules/require.js>
<TMPL_INLINE _modules/fetch.js>

<TMPL_JS_MODULE booking/exp>
<TMPL_JS_MODULE booking/track>
<TMPL_JS_MODULE booking/util>

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
- relative path were converted to absolute path (for static analysis)
- If directory, will use `directory/index.js`

### Static Analysis?

Suppose we have multiple script tags in one page.

```markup
<script src="http://bstatic.jyang-app.dev.booking.com/main.js">
<script src="http://bstatic.jyang-app.dev.booking.com/landingpages.js">
```

And both file have included the same module `_modules/bui/lightbox.js`.

When handling the request, server can analysis these JS files by simple grepping `require(.*)`, find out the duplicate includes, and give the developer warnings.



## booking.(...)

### booking.ready

A proxy to $.ready with priority support.
Alternative for sNSStartup.

```javascript
booking.ready(function() {
}, 5);
```


### booking.exp

Code:

```javascript
module.exports = exp

var env = require('booking/env');

function exp(name) {
  var expriment = {
    name: name,
    hash: name  // add alias
  };
  env.expriments[name] = expriment;
  return experiment;
}
```

Example usage:

```javascript
(function() {

var booking = require('booking');
var Lightbox = require('bui/lightbox')

var exp = booking.exp('<TMPL_VAR b_expriment_hash_xxxx');

// initialization setup for Base/Variants
exp.initialize = function(variant) {
  booking.track.custom_goal(this.name, 1);
};

exp.runVariant = function(variant) {
  var box = new Lightbox();
  if (variant == 2) {
    box.setOption('xxx', true);
  }
}
})()
```

### booking.medaitor

Events center, with pub/sub.

```
exports.subscribe = function() {
}
```


## BUI

Booking UI Components with conventions.

### base.js

A boilterplate class, to provide conventions.

An extentable class with standard methods about events/templates/$dom.

For `bui/index.js`

```javascript
var Base = require('bui/base');

exports.cohere = function extends(Component) {
  return __extend(Component, Base)
};
```


Example component:

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
3. Clear indication of class method vs instance method.


## Essentials


(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],2:[function(require,module,exports){
var snabbdom = require('../../snabbdom.js');
var patch = snabbdom.init([
  require('../../modules/class'),
  require('../../modules/props'),
  require('../../modules/style'),
  require('../../modules/eventlisteners'),
]);
var h = require('../../h.js');
var vdomPatchLive = require('vdom-patch-live');

var patchSnabbdom = function(render, patchData) {
    if(!patchData.domElement) {
        patchData.domElement = document.createElement("div");
        patchData.vNode = patch(patchData.domElement, h("div", [render(h)]));
        document.getElementById("container").appendChild(patchData.domElement);
    } else {
        patchData.vNode = patch(patchData.vNode, h("div", [render(h)]));
    }
    return patchData;
};

var TodoApp = {
    viewModel: require("./viewModel"),

    view: function () {
        var vm = this.viewModel;
		vm.todoStore.init();

        return function (h) {
            var todoStore = vm.todoStore;
            var todoExists = todoStore.todos.length > 0;

            var appNodes = [
                h("header.header", [
                    h("h1", ["todos"]),
                    h("input#new-todo.new-todo", {
                        props: {
                            "placeholder": "What needs to be done?",
                            "autofocus": ""
                        },
                        on: {
                            keyup: function (e) {
                                vm.addTodo(e, e.target);
                            }
                        }
                    })
                ])
            ];
            if (todoExists) {
                appNodes.push(h("section.main", [
                    h("input.toggle-all", {
                        props: {
                            "type": "checkbox",
                            "checked": todoStore.allCompleted()
                        },
                        on: {
                            click: function (e) {
                                todoStore.setAllTo(e.target)
                            }
                        }
                    }),
                    h("ul.todo-list", todoStore.todos.map(function (todo) {
                        return h("li", {
                            props: {className: [todo.completed ? "completed" : "", todo.editing ? "editing" : ""].join(" ")}
                        }, [
                            h("div.view", [
                                h("input.toggle", {
                                    props: {"type": "checkbox", checked: todo.completed},
                                    on: {
                                        click: function () {
                                            vm.toggleCompletion(todo.uid)
                                        }
                                    }
                                }),
                                h("label", {
                                    on: {
                                        dblclick: function () {
                                            vm.editTodo(todo);
                                        }
                                    }
                                }, todo.title),
                                h("button.destroy", {
                                    on: {
                                        click: function () {
                                            vm.remove(todo.uid);
                                        }
                                    }
                                })
                            ]),
                            todo.editing ? h("input.edit", {
                                props: {value: todo.title},
                                on: {
                                    blur: function (e) {
                                        vm.stopEditing(todo, e.target);
                                    },
                                    keyup: function (e) {
                                        if (e.keyCode == 13) {
                                            vm.updateEditingTodo(e.target, todo);
                                        }
                                        else if (e.keyCode == 27) {
                                            vm.cancelEditingTodo(todo);
                                        }
                                    }
                                }
                            }) : h("span")
                        ]);
                    }))
                ]));
                if (todoStore.getCompleted().length > 0) {
                    appNodes.push(h("footer.footer", [
                        h("span.todo-count", [h("strong", todoStore.getRemaining().length), todoStore.getRemaining().length == 1 ? 'item' : 'items' + ' left']),
                        h("button.clear-completed", {
                            on: {
                                click: function () {
                                    vm.removeCompleted();
                                }
                            }
                        }, ["Clear completed"])
                    ]));
                }
            }

            return h("section.todoapp", appNodes);
        }
    }
};

window.addEventListener('DOMContentLoaded', function () {
	vdomPatchLive(patchSnabbdom, function (renderLive) {
        renderLive(TodoApp.view());
	});
});

},{"../../h.js":6,"../../modules/class":8,"../../modules/eventlisteners":9,"../../modules/props":10,"../../modules/style":11,"../../snabbdom.js":28,"./viewModel":5,"vdom-patch-live":12}],3:[function(require,module,exports){
var uuid = require("./uuid");

function Todo(title) {
    return {
        completed: false,
        editing: false,
        title: title.trim(),
        uid: uuid.v4(),
        setTitle: function (title) {
            this.title = title.trim();
        }
    }
}

module.exports = {
    todos: [],
    init: function () {
		/*
        var persistedTodos = JSON.parse(localStorage.getItem('snabbdom-todos')) || [];
        // Normalize back into classes
        this.todos = persistedTodos.map(function (todo) {
            var ret = Todo(todo.title);
            ret.completed = todo.completed;
            ret.uid = todo.uid;
            return ret;
        });
		*/
    },
    _updateStore: function () {
        //localStorage.setItem('snabbdom-todos', JSON.stringify(this.todos));
    },
    get: function (state) {
        return this.todos.filter(function (todo) {
            return todo.completed === state.completed
        });
    },
    allCompleted: function () {
        return this.todos.length === this.getCompleted().length;
    },
    setAllTo: function (toggler) {
        this.todos.forEach(function (t) {
            t.completed = toggler.checked
        });
        this._updateStore();
    },
    removeCompleted: function () {
        this.todos = this.get({completed: false});
    },
    getRemaining: function () {
        return this.get({completed: false});
    },
    getCompleted: function () {
        return this.get({completed: true});
    },
    toggleCompletion: function (uid) {
        this.todos.forEach(function(todo) {
            if (todo.uid === uid) {
                todo.completed = !todo.completed;
                return;
            }
        });
        this._updateStore();
    },
    remove: function (uid) {
		var todos = this.todos;
        todos.forEach(function(todo) {
            if (todo.uid === uid) {
                todos.splice(todos.indexOf(todo), 1);
                return;
            }
        });
        this._updateStore();
    },
    add: function (title) {
        this.todos.push(Todo(title));
        this._updateStore();
    }
};
},{"./uuid":4}],4:[function(require,module,exports){
//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

(function() {
  var _global = this;

  // Unique ID creation requires a high quality random # generator.  We feature
  // detect to determine the best RNG source, normalizing to a function that
  // returns 128-bits of randomness, since that's what's usually required
  var _rng;

  // Allow for MSIE11 msCrypto
  var _crypto = _global.crypto || _global.msCrypto;

  // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
  //
  // Moderately fast, high quality
  if (typeof(_global.require) == 'function') {
    try {
      var _rb = _global.require('crypto').randomBytes;
      _rng = _rb && function() {return _rb(16);};
    } catch(e) {}
  }

  if (!_rng && _crypto && _crypto.getRandomValues) {
    // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
    //
    // Moderately fast, high quality
    var _rnds8 = new Uint8Array(16);
    _rng = function whatwgRNG() {
      _crypto.getRandomValues(_rnds8);
      return _rnds8;
    };
  }

  if (!_rng) {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    var  _rnds = new Array(16);
    _rng = function() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return _rnds;
    };
  }

  // Buffer class to use
  var BufferClass = typeof(_global.Buffer) == 'function' ? _global.Buffer : Array;

  // Maps for number <-> hex string conversion
  var _byteToHex = [];
  var _hexToByte = {};
  for (var i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
  }

  // **`parse()` - Parse a UUID into it's component bytes**
  function parse(s, buf, offset) {
    var i = (buf && offset) || 0, ii = 0;

    buf = buf || [];
    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
      if (ii < 16) { // Don't overflow!
        buf[i + ii++] = _hexToByte[oct];
      }
    });

    // Zero out remaining bytes if string was short
    while (ii < 16) {
      buf[i + ii++] = 0;
    }

    return buf;
  }

  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
  function unparse(buf, offset) {
    var i = offset || 0, bth = _byteToHex;
    return  bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]];
  }

  // **`v1()` - Generate time-based UUID**
  //
  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html

  // random #'s we need to init node and clockseq
  var _seedBytes = _rng();

  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
  var _nodeId = [
    _seedBytes[0] | 0x01,
    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
  ];

  // Per 4.2.2, randomize (14 bit) clockseq
  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

  // Previous uuid creation time
  var _lastMSecs = 0, _lastNSecs = 0;

  // See https://github.com/broofa/node-uuid for API details
  function v1(options, buf, offset) {
    var i = buf && offset || 0;
    var b = buf || [];

    options = options || {};

    var clockseq = options.clockseq != null ? options.clockseq : _clockseq;

    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    var msecs = options.msecs != null ? options.msecs : new Date().getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq == null) {
      clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
      nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
      throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    var node = options.node || _nodeId;
    for (var n = 0; n < 6; n++) {
      b[i + n] = node[n];
    }

    return buf ? buf : unparse(b);
  }

  // **`v4()` - Generate random UUID**

  // See https://github.com/broofa/node-uuid for API details
  function v4(options, buf, offset) {
    // Deprecated - 'format' argument, as supported in v1.2
    var i = buf && offset || 0;

    if (typeof(options) == 'string') {
      buf = options == 'binary' ? new BufferClass(16) : null;
      options = null;
    }
    options = options || {};

    var rnds = options.random || (options.rng || _rng)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
      for (var ii = 0; ii < 16; ii++) {
        buf[i + ii] = rnds[ii];
      }
    }

    return buf || unparse(rnds);
  }

  // Export public API
  var uuid = v4;
  uuid.v1 = v1;
  uuid.v4 = v4;
  uuid.parse = parse;
  uuid.unparse = unparse;
  uuid.BufferClass = BufferClass;

  if (typeof(module) != 'undefined' && module.exports) {
    // Publish as node.js module
    module.exports = uuid;
  } else  if (typeof define === 'function' && define.amd) {
    // Publish as AMD module
    define(function() {return uuid;});
 

  } else {
    // Publish as global (in browsers)
    var _previousRoot = _global.uuid;

    // **`noConflict()` - (browser only) to reset global 'uuid' var**
    uuid.noConflict = function() {
      _global.uuid = _previousRoot;
      return uuid;
    };

    _global.uuid = uuid;
  }
}).call(this);

},{}],5:[function(require,module,exports){
module.exports = {
    todoStore: require("./store"),

    stopEditing: function(todo, editedTitle) {
        todo.setTitle(editedTitle.value);
        todo.editing = false;
    },

    cancelEditingTodo: function(todo) {
        todo.editing = false;
    },

    updateEditingTodo: function(editedTitle, todo) {
        editedTitle = editedTitle.value.trim();
        todo.editing = false;

        if (editedTitle.length === 0) {
            return this.todoStore.remove(todo.uid);
        }

        todo.setTitle(editedTitle);
    },

    editTodo: function(todo) {
        todo.editing = true;
    },

    removeCompleted: function() {
        this.todoStore.removeCompleted();
    },

    toggleCompletion: function(uid) {
        this.todoStore.toggleCompletion(uid);
    },

    remove: function(uid) {
        this.todoStore.remove(uid);
    },

    addTodo: function($event, newtodo) {
        if ($event.keyCode === 13 && newtodo.value.trim().length) {
            this.todoStore.add(newtodo.value);
            newtodo.value = '';
        }
    }
};
},{"./store":3}],6:[function(require,module,exports){
var VNode = require('./vnode');
var is = require('./is');

module.exports = function h(sel, b, c) {
  var data = {}, children, text, i;
  if (arguments.length === 3) {
    data = b;
    if (is.array(c)) { children = c; }
    else if (is.primitive(c)) { text = c; }
  } else if (arguments.length === 2) {
    if (is.array(b)) { children = b; }
    else if (is.primitive(b)) { text = b; }
    else { data = b; }
  }
  if (is.array(children)) {
    for (i = 0; i < children.length; ++i) {
      if (is.primitive(children[i])) children[i] = VNode(undefined, undefined, undefined, children[i]);
    }
  }
  return VNode(sel, data, children, text, undefined);
};

},{"./is":7,"./vnode":29}],7:[function(require,module,exports){
module.exports = {
  array: Array.isArray,
  primitive: function(s) { return typeof s === 'string' || typeof s === 'number'; },
};

},{}],8:[function(require,module,exports){
function updateClass(oldVnode, vnode) {
  var cur, name, elm = vnode.elm,
      oldClass = oldVnode.data.class || {},
      klass = vnode.data.class || {};
  for (name in klass) {
    cur = klass[name];
    if (cur !== oldClass[name]) {
      elm.classList[cur ? 'add' : 'remove'](name);
    }
  }
}

module.exports = {create: updateClass, update: updateClass};

},{}],9:[function(require,module,exports){
var is = require('../is');

function arrInvoker(arr) {
  return function() { arr[0](arr[1]); };
}

function fnInvoker(arr) {
  return function(ev) { arr[0](ev); };
}

function updateEventListeners(oldVnode, vnode) {
  var name, cur, old, elm = vnode.elm,
      oldOn = oldVnode.data.on || {}, on = vnode.data.on;
  if (!on) return;
  for (name in on) {
    cur = on[name];
    old = oldOn[name];
    if (old === undefined) {
      if (is.array(cur)) {
        elm.addEventListener(name, arrInvoker(cur));
      } else {
        cur = [cur];
        on[name] = cur;
        elm.addEventListener(name, fnInvoker(cur));
      }
    } else if (old.length === 2) {
      old[0] = cur[0]; // Deliberately modify old array since it's
      old[1] = cur[1]; // captured in closure created with `arrInvoker`
      on[name]  = old;
    } else {
      old[0] = cur;
      on[name] = old;
    }
  }
}

module.exports = {create: updateEventListeners, update: updateEventListeners};

},{"../is":7}],10:[function(require,module,exports){
function updateProps(oldVnode, vnode) {
  var key, cur, old, elm = vnode.elm,
      oldProps = oldVnode.data.props || {}, props = vnode.data.props || {};
  for (key in props) {
    cur = props[key];
    old = oldProps[key];
    if (old !== cur) {
      elm[key] = cur;
    }
  }
}

module.exports = {create: updateProps, update: updateProps};

},{}],11:[function(require,module,exports){
var raf = requestAnimationFrame || setTimeout;
var nextFrame = function(fn) { raf(function() { raf(fn); }); };

function setNextFrame(obj, prop, val) {
  nextFrame(function() { obj[prop] = val; });
}

function updateStyle(oldVnode, vnode) {
  var cur, name, elm = vnode.elm,
      oldStyle = oldVnode.data.style || {},
      style = vnode.data.style || {},
      oldHasDel = 'delayed' in oldStyle;
  for (name in style) {
    cur = style[name];
    if (name === 'delayed') {
      for (name in style.delayed) {
        cur = style.delayed[name];
        if (!oldHasDel || cur !== oldStyle.delayed[name]) {
          setNextFrame(elm.style, name, cur);
        }
      }
    } else if (name !== 'remove' && cur !== oldStyle[name]) {
      elm.style[name] = cur;
    }
  }
}

function applyDestroyStyle(vnode) {
  var style, name, elm = vnode.elm, s = vnode.data.style;
  if (!s || !(style = s.destroy)) return;
  for (name in style) {
    elm.style[name] = style[name];
  }
}

function applyRemoveStyle(vnode, rm) {
  var s = vnode.data.style;
  if (!s || !s.remove) {
    rm();
    return;
  }
  var name, elm = vnode.elm, idx, i = 0, maxDur = 0,
      compStyle, style = s.remove, amount = 0;
  var applied = [];
  for (name in style) {
    applied.push(name);
    elm.style[name] = style[name];
  }
  compStyle = getComputedStyle(elm);
  var props = compStyle['transition-property'].split(', ');
  for (; i < props.length; ++i) {
    if(applied.indexOf(props[i]) !== -1) amount++;
  }
  elm.addEventListener('transitionend', function(ev) {
    if (ev.target === elm) --amount;
    if (amount === 0) rm();
  });
}

module.exports = {create: updateStyle, update: updateStyle, destroy: applyDestroyStyle, remove: applyRemoveStyle};

},{}],12:[function(require,module,exports){
var requestAnimationFrame = require('raf');
var zoneWrapper = require('zone.js');

module.exports = function (patch, zoneCode) {
    var redrawList = [];
    var isRendering = false;

    var factory = function (render) {
        var patchData = {};
        patch(render, patchData);
        var redrawId = null;

        function requestRedraw() {
            if (redrawId === null) {
                redrawId = requestAnimationFrame(function () {
                    redrawId = null;
                    // clean up
                    if (!patchData.domElement.parentNode) {
                        redrawList.splice(redrawList.indexOf(requestRedraw), 1);
                        return;
                    }
                    // ensure entire patch operation is done within the zone run for proper handler attachment
                    isRendering = true; // avoid triggering a re-render.
                    currentZone.run(function () {
                        patch(render, patchData);
                    });
                    isRendering = false;
                });
            }
        }
        redrawList.push(requestRedraw);
    };

    var currentZoneIsInitialized = false;
    var currentZone = zoneWrapper.zone.fork({
        afterTask: function () {
            if (currentZoneIsInitialized && !isRendering) {
                redrawList.forEach(function (hook) { hook(); });
            }
        }
    });

    currentZoneIsInitialized = true;
    currentZone.run(function () {
        zoneCode(factory);
    });
};
},{"raf":13,"zone.js":27}],13:[function(require,module,exports){
var now = require('performance-now')
  , global = typeof window === 'undefined' ? {} : window
  , vendors = ['moz', 'webkit']
  , suffix = 'AnimationFrame'
  , raf = global['request' + suffix]
  , caf = global['cancel' + suffix] || global['cancelRequest' + suffix]

for(var i = 0; i < vendors.length && !raf; i++) {
  raf = global[vendors[i] + 'Request' + suffix]
  caf = global[vendors[i] + 'Cancel' + suffix]
      || global[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
  var last = 0
    , id = 0
    , queue = []
    , frameDuration = 1000 / 60

  raf = function(callback) {
    if(queue.length === 0) {
      var _now = now()
        , next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function() {
        var cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for(var i = 0; i < cp.length; i++) {
          if(!cp[i].cancelled) {
            try{
              cp[i].callback(last)
            } catch(e) {
              setTimeout(function() { throw e }, 0)
            }
          }
        }
      }, Math.round(next))
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    })
    return id
  }

  caf = function(handle) {
    for(var i = 0; i < queue.length; i++) {
      if(queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }
}

module.exports = function(fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  return raf.call(global, fn)
}
module.exports.cancel = function() {
  caf.apply(global, arguments)
}

},{"performance-now":14}],14:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.6.3
(function() {
  var getNanoSeconds, hrtime, loadTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - loadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    loadTime = getNanoSeconds();
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);

/*
//@ sourceMappingURL=performance-now.map
*/

}).call(this,require('_process'))
},{"_process":1}],15:[function(require,module,exports){
(function (global){
'use strict';

function Zone(parentZone, data) {
  var zone = (arguments.length) ? Object.create(parentZone) : this;

  zone.parent = parentZone || null;

  Object.keys(data || {}).forEach(function(property) {

    var _property = property.substr(1);

    // augment the new zone with a hook decorates the parent's hook
    if (property[0] === '$') {
      zone[_property] = data[property](parentZone[_property] || function () {});

    // augment the new zone with a hook that runs after the parent's hook
    } else if (property[0] === '+') {
      if (parentZone[_property]) {
        zone[_property] = function () {
          var result = parentZone[_property].apply(this, arguments);
          data[property].apply(this, arguments);
          return result;
        };
      } else {
        zone[_property] = data[property];
      }

    // augment the new zone with a hook that runs before the parent's hook
    } else if (property[0] === '-') {
      if (parentZone[_property]) {
        zone[_property] = function () {
          data[property].apply(this, arguments);
          return parentZone[_property].apply(this, arguments);
        };
      } else {
        zone[_property] = data[property];
      }

    // set the new zone's hook (replacing the parent zone's)
    } else {
      zone[property] = (typeof data[property] === 'object') ?
                        JSON.parse(JSON.stringify(data[property])) :
                        data[property];
    }
  });

  zone.$id = Zone.nextId++;

  return zone;
}

Zone.prototype = {
  constructor: Zone,

  fork: function (locals) {
    this.onZoneCreated();
    return new Zone(this, locals);
  },

  bind: function (fn, skipEnqueue) {
    skipEnqueue || this.enqueueTask(fn);
    var zone = this.isRootZone() ? this : this.fork();
    return function zoneBoundFn() {
      return zone.run(fn, this, arguments);
    };
  },

  bindOnce: function (fn) {
    var boundZone = this;
    return this.bind(function () {
      var result = fn.apply(this, arguments);
      boundZone.dequeueTask(fn);
      return result;
    });
  },

  isRootZone: function() {
    return this.parent === null;
  },

  run: function run (fn, applyTo, applyWith) {
    applyWith = applyWith || [];

    var oldZone = global.zone;

    // MAKE THIS ZONE THE CURRENT ZONE
    global.zone = this;

    try {
      this.beforeTask();
      return fn.apply(applyTo, applyWith);
    } catch (e) {
      if (this.onError) {
        this.onError(e);
      } else {
        throw e;
      }
    } finally {
      this.afterTask();
      // REVERT THE CURRENT ZONE BACK TO THE ORIGINAL ZONE
      global.zone = oldZone;
    }
  },

  // onError is used to override error handling.
  // When a custom error handler is provided, it should most probably rethrow the exception
  // not to break the expected control flow:
  //
  // `promise.then(fnThatThrows).catch(fn);`
  //
  // When this code is executed in a zone with a custom onError handler that doesn't rethrow, the
  // `.catch()` branch will not be taken as the `fnThatThrows` exception will be swallowed by the
  // handler.
  onError: null,
  beforeTask: function () {},
  onZoneCreated: function () {},
  afterTask: function () {},
  enqueueTask: function () {},
  dequeueTask: function () {}
};

// Root zone ID === 1
Zone.nextId = 1;

Zone.bindPromiseFn = require('./patch/promise').bindPromiseFn;

module.exports = {
  Zone: Zone
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./patch/promise":22}],16:[function(require,module,exports){
(function (global){
'use strict';

var fnPatch = require('./functions');
var promisePatch = require('./promise');
var mutationObserverPatch = require('./mutation-observer');
var definePropertyPatch = require('./define-property');
var registerElementPatch = require('./register-element');
var webSocketPatch = require('./websocket');
var eventTargetPatch = require('./event-target');
var propertyDescriptorPatch = require('./property-descriptor');
var geolocationPatch = require('./geolocation');

function apply() {
  fnPatch.patchSetClearFunction(global, [
    'timeout',
    'interval',
    'immediate'
  ]);

  fnPatch.patchSetFunction(global, [
    'requestAnimationFrame',
    'mozRequestAnimationFrame',
    'webkitRequestAnimationFrame'
  ]);

  fnPatch.patchFunction(global, [
    'alert',
    'prompt'
  ]);

  eventTargetPatch.apply();

  propertyDescriptorPatch.apply();

  promisePatch.apply();

  mutationObserverPatch.patchClass('MutationObserver');
  mutationObserverPatch.patchClass('WebKitMutationObserver');

  definePropertyPatch.apply();

  registerElementPatch.apply();

  geolocationPatch.apply();
}

module.exports = {
  apply: apply
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./define-property":17,"./event-target":18,"./functions":19,"./geolocation":20,"./mutation-observer":21,"./promise":22,"./property-descriptor":23,"./register-element":24,"./websocket":25}],17:[function(require,module,exports){
'use strict';

// might need similar for object.freeze
// i regret nothing

var _defineProperty = Object.defineProperty;
var _getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
var _create = Object.create;

function apply() {
  Object.defineProperty = function (obj, prop, desc) {
    if (isUnconfigurable(obj, prop)) {
      throw new TypeError('Cannot assign to read only property \'' + prop + '\' of ' + obj);
    }
    if (prop !== 'prototype') {
      desc = rewriteDescriptor(obj, prop, desc);
    }
    return _defineProperty(obj, prop, desc);
  };

  Object.defineProperties = function (obj, props) {
    Object.keys(props).forEach(function (prop) {
      Object.defineProperty(obj, prop, props[prop]);
    });
    return obj;
  };

  Object.create = function (obj, proto) {
    if (typeof proto === 'object') {
      Object.keys(proto).forEach(function (prop) {
        proto[prop] = rewriteDescriptor(obj, prop, proto[prop]);
      });
    }
    return _create(obj, proto);
  };

  Object.getOwnPropertyDescriptor = function (obj, prop) {
    var desc = _getOwnPropertyDescriptor(obj, prop);
    if (isUnconfigurable(obj, prop)) {
      desc.configurable = false;
    }
    return desc;
  };
};

function _redefineProperty(obj, prop, desc) {
  desc = rewriteDescriptor(obj, prop, desc);
  return _defineProperty(obj, prop, desc);
};

function isUnconfigurable (obj, prop) {
  return obj && obj.__unconfigurables && obj.__unconfigurables[prop];
}

function rewriteDescriptor (obj, prop, desc) {
  desc.configurable = true;
  if (!desc.configurable) {
    if (!obj.__unconfigurables) {
      _defineProperty(obj, '__unconfigurables', { writable: true, value: {} });
    }
    obj.__unconfigurables[prop] = true;
  }
  return desc;
}

module.exports = {
  apply: apply,
  _redefineProperty: _redefineProperty
};



},{}],18:[function(require,module,exports){
(function (global){
'use strict';

var utils = require('../utils');

function apply() {
  // patched properties depend on addEventListener, so this needs to come first
  if (global.EventTarget) {
    utils.patchEventTargetMethods(global.EventTarget.prototype);

  // Note: EventTarget is not available in all browsers,
  // if it's not available, we instead patch the APIs in the IDL that inherit from EventTarget
  } else {
    var apis = [ 'ApplicationCache',
      'EventSource',
      'FileReader',
      'InputMethodContext',
      'MediaController',
      'MessagePort',
      'Node',
      'Performance',
      'SVGElementInstance',
      'SharedWorker',
      'TextTrack',
      'TextTrackCue',
      'TextTrackList',
      'WebKitNamedFlow',
      'Window',
      'Worker',
      'WorkerGlobalScope',
      'XMLHttpRequest',
      'XMLHttpRequestEventTarget',
      'XMLHttpRequestUpload'
    ];

    apis.forEach(function(thing) {
      global[thing] && utils.patchEventTargetMethods(global[thing].prototype);
    });
  }
}

module.exports = {
  apply: apply
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../utils":26}],19:[function(require,module,exports){
(function (global){
'use strict';

var utils = require('../utils');

function patchSetClearFunction(obj, fnNames) {
  fnNames.map(function (name) {
    return name[0].toUpperCase() + name.substr(1);
  }).forEach(function (name) {
    var setName = 'set' + name;
    var delegate = obj[setName];

    if (delegate) {
      var clearName = 'clear' + name;
      var ids = {};

      var bindArgs = setName === 'setInterval' ? utils.bindArguments : utils.bindArgumentsOnce;

      global.zone[setName] = function (fn) {
        var id, fnRef = fn;
        arguments[0] = function () {
          delete ids[id];
          return fnRef.apply(this, arguments);
        };
        var args = bindArgs(arguments);
        id = delegate.apply(obj, args);
        ids[id] = true;
        return id;
      };

      obj[setName] = function () {
        return global.zone[setName].apply(this, arguments);
      };

      var clearDelegate = obj[clearName];

      global.zone[clearName] = function (id) {
        if (ids[id]) {
          delete ids[id];
          global.zone.dequeueTask();
        }
        return clearDelegate.apply(this, arguments);
      };

      obj[clearName] = function () {
        return global.zone[clearName].apply(this, arguments);
      };
    }
  });
};

function patchSetFunction(obj, fnNames) {
  fnNames.forEach(function (name) {
    var delegate = obj[name];

    if (delegate) {
      global.zone[name] = function (fn) {
        var fnRef = fn;
        arguments[0] = function () {
          return fnRef.apply(this, arguments);
        };
        var args = utils.bindArgumentsOnce(arguments);
        return delegate.apply(obj, args);
      };

      obj[name] = function () {
        return zone[name].apply(this, arguments);
      };
    }
  });
};

function patchFunction(obj, fnNames) {
  fnNames.forEach(function (name) {
    var delegate = obj[name];
    global.zone[name] = function () {
      return delegate.apply(obj, arguments);
    };

    obj[name] = function () {
      return global.zone[name].apply(this, arguments);
    };
  });
};


module.exports = {
  patchSetClearFunction: patchSetClearFunction,
  patchSetFunction: patchSetFunction,
  patchFunction: patchFunction
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../utils":26}],20:[function(require,module,exports){
(function (global){
'use strict';

var utils = require('../utils');

function apply() {
  if (global.navigator && global.navigator.geolocation) {
    utils.patchPrototype(global.navigator.geolocation, [
      'getCurrentPosition',
      'watchPosition'
    ]);
  }
}

module.exports = {
  apply: apply
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../utils":26}],21:[function(require,module,exports){
(function (global){
'use strict';

// wrap some native API on `window`
function patchClass(className) {
  var OriginalClass = global[className];
  if (!OriginalClass) return;

  global[className] = function (fn) {
    this._o = new OriginalClass(global.zone.bind(fn, true));
    // Remember where the class was instantiate to execute the enqueueTask and dequeueTask hooks
    this._creationZone = global.zone;
  };

  var instance = new OriginalClass(function () {});

  global[className].prototype.disconnect = function () {
    var result = this._o.disconnect.apply(this._o, arguments);
    if (this._active) {
      this._creationZone.dequeueTask();
      this._active = false;
    }
    return result;
  };

  global[className].prototype.observe = function () {
    if (!this._active) {
      this._creationZone.enqueueTask();
      this._active = true;
    }
    return this._o.observe.apply(this._o, arguments);
  };

  var prop;
  for (prop in instance) {
    (function (prop) {
      if (typeof global[className].prototype !== undefined) {
        return;
      }
      if (typeof instance[prop] === 'function') {
        global[className].prototype[prop] = function () {
          return this._o[prop].apply(this._o, arguments);
        };
      } else {
        Object.defineProperty(global[className].prototype, prop, {
          set: function (fn) {
            if (typeof fn === 'function') {
              this._o[prop] = global.zone.bind(fn);
            } else {
              this._o[prop] = fn;
            }
          },
          get: function () {
            return this._o[prop];
          }
        });
      }
    }(prop));
  }
};

module.exports = {
  patchClass: patchClass
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],22:[function(require,module,exports){
(function (global){
'use strict';

var utils = require('../utils');

/*
 * Patches a function that returns a Promise-like instance.
 *
 * This function must be used when either:
 * - Native Promises are not available,
 * - The function returns a Promise-like object.
 *
 * This is required because zones rely on a Promise monkey patch that could not be applied when
 * Promise is not natively available or when the returned object is not an instance of Promise.
 *
 * Note that calling `bindPromiseFn` on a function that returns a native Promise will also work
 * with minimal overhead.
 *
 * ```
 * var boundFunction = bindPromiseFn(FunctionReturningAPromise);
 *
 * boundFunction.then(successHandler, errorHandler);
 * ```
 */
var bindPromiseFn;

if (global.Promise) {
  bindPromiseFn = function (delegate) {
    return function() {
      var delegatePromise = delegate.apply(this, arguments);

      // if the delegate returned an instance of Promise, forward it.
      if (delegatePromise instanceof Promise) {
        return delegatePromise;
      }

      // Otherwise wrap the Promise-like in a global Promise
      return new Promise(function(resolve, reject) {
        delegatePromise.then(resolve, reject);
      });
    };
  };
} else {
  bindPromiseFn = function (delegate) {
    return function () {
      return _patchThenable(delegate.apply(this, arguments));
    };
  };
}


function _patchPromiseFnsOnObject(objectPath, fnNames) {
  var obj = global;

  var exists = objectPath.every(function (segment) {
    obj = obj[segment];
    return obj;
  });

  if (!exists) {
    return;
  }

  fnNames.forEach(function (name) {
    var fn = obj[name];
    if (fn) {
      obj[name] = bindPromiseFn(fn);
    }
  });
}

function _patchThenable(thenable) {
  var then = thenable.then;
  thenable.then = function () {
    var args = utils.bindArguments(arguments);
    var nextThenable = then.apply(thenable, args);
    return _patchThenable(nextThenable);
  };

  var ocatch = thenable.catch;
  thenable.catch = function () {
    var args = utils.bindArguments(arguments);
    var nextThenable = ocatch.apply(thenable, args);
    return _patchThenable(nextThenable);
  };

  return thenable;
}


function apply() {
  // Patch .then() and .catch() on native Promises to execute callbacks in the zone where
  // those functions are called.
  if (global.Promise) {
    utils.patchPrototype(Promise.prototype, [
      'then',
      'catch'
    ]);

    // Patch browser APIs that return a Promise
    var patchFns = [
      // fetch
      [[], ['fetch']],
      [['Response', 'prototype'], ['arrayBuffer', 'blob', 'json', 'text']]
    ];

    patchFns.forEach(function(objPathAndFns) {
      _patchPromiseFnsOnObject(objPathAndFns[0], objPathAndFns[1]);
    });
  }
}

module.exports = {
  apply: apply,
  bindPromiseFn: bindPromiseFn
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../utils":26}],23:[function(require,module,exports){
(function (global){
'use strict';

var webSocketPatch = require('./websocket');
var utils = require('../utils');

var eventNames = 'copy cut paste abort blur focus canplay canplaythrough change click contextmenu dblclick drag dragend dragenter dragleave dragover dragstart drop durationchange emptied ended input invalid keydown keypress keyup load loadeddata loadedmetadata loadstart message mousedown mouseenter mouseleave mousemove mouseout mouseover mouseup pause play playing progress ratechange reset scroll seeked seeking select show stalled submit suspend timeupdate volumechange waiting mozfullscreenchange mozfullscreenerror mozpointerlockchange mozpointerlockerror error webglcontextrestored webglcontextlost webglcontextcreationerror'.split(' ');

function apply() {
  if (canPatchViaPropertyDescriptor()) {
    // for browsers that we can patch the descriptor:  Chrome & Firefox
    var onEventNames = eventNames.map(function (property) {
      return 'on' + property;
    });
    utils.patchProperties(HTMLElement.prototype, onEventNames);
    utils.patchProperties(XMLHttpRequest.prototype);
    if (typeof WebSocket !== 'undefined') {
      utils.patchProperties(WebSocket.prototype);
    }
  } else {
    // Safari
    patchViaCapturingAllTheEvents();
    utils.patchClass('XMLHttpRequest');
    webSocketPatch.apply();
  }
}

function canPatchViaPropertyDescriptor() {
  if (!Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'onclick') && typeof Element !== 'undefined') {
    // WebKit https://bugs.webkit.org/show_bug.cgi?id=134364
    // IDL interface attributes are not configurable
    var desc = Object.getOwnPropertyDescriptor(Element.prototype, 'onclick');
    if (desc && !desc.configurable) return false;
  }

  Object.defineProperty(HTMLElement.prototype, 'onclick', {
    get: function () {
      return true;
    }
  });
  var elt = document.createElement('div');
  var result = !!elt.onclick;
  Object.defineProperty(HTMLElement.prototype, 'onclick', {});
  return result;
};

// Whenever any event fires, we check the event target and all parents
// for `onwhatever` properties and replace them with zone-bound functions
// - Chrome (for now)
function patchViaCapturingAllTheEvents() {
  eventNames.forEach(function (property) {
    var onproperty = 'on' + property;
    document.addEventListener(property, function (event) {
      var elt = event.target, bound;
      while (elt) {
        if (elt[onproperty] && !elt[onproperty]._unbound) {
          bound = global.zone.bind(elt[onproperty]);
          bound._unbound = elt[onproperty];
          elt[onproperty] = bound;
        }
        elt = elt.parentElement;
      }
    }, true);
  });
};

module.exports = {
  apply: apply
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../utils":26,"./websocket":25}],24:[function(require,module,exports){
(function (global){
'use strict';

var _redefineProperty = require('./define-property')._redefineProperty;

function apply() {
  if (!('registerElement' in global.document)) {
    return;
  }

  var _registerElement = document.registerElement;
  var callbacks = [
    'createdCallback',
    'attachedCallback',
    'detachedCallback',
    'attributeChangedCallback'
  ];

  document.registerElement = function (name, opts) {
    if (opts && opts.prototype) {
      callbacks.forEach(function (callback) {
        if (opts.prototype.hasOwnProperty(callback)) {
          var descriptor = Object.getOwnPropertyDescriptor(opts.prototype, callback);
          if (descriptor.value) {
            descriptor.value = global.zone.bind(descriptor.value);
            _redefineProperty(opts.prototype, callback, descriptor);
          } else {
            opts.prototype[callback] = global.zone.bind(opts.prototype[callback]);
          }
        } else if (opts.prototype[callback]) {
          opts.prototype[callback] = global.zone.bind(opts.prototype[callback]);
        }
      });
    }

    return _registerElement.apply(document, [name, opts]);
  };
}

module.exports = {
  apply: apply
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./define-property":17}],25:[function(require,module,exports){
(function (global){
'use strict';

var utils = require('../utils');

// we have to patch the instance since the proto is non-configurable
function apply() {
  var WS = global.WebSocket;
  utils.patchEventTargetMethods(WS.prototype);
  global.WebSocket = function(a, b) {
    var socket = arguments.length > 1 ? new WS(a, b) : new WS(a);
    var proxySocket;

    // Safari 7.0 has non-configurable own 'onmessage' and friends properties on the socket instance
    var onmessageDesc = Object.getOwnPropertyDescriptor(socket, 'onmessage');
    if (onmessageDesc && onmessageDesc.configurable === false) {
      proxySocket = Object.create(socket);
      ['addEventListener', 'removeEventListener', 'send', 'close'].forEach(function(propName) {
        proxySocket[propName] = function() {
          return socket[propName].apply(socket, arguments);
        };
      });
    } else {
      // we can patch the real socket
      proxySocket = socket;
    }

    utils.patchProperties(proxySocket, ['onclose', 'onerror', 'onmessage', 'onopen']);

    return proxySocket;
  };
}

module.exports = {
  apply: apply
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../utils":26}],26:[function(require,module,exports){
(function (global){
'use strict';

function bindArguments(args) {
  for (var i = args.length - 1; i >= 0; i--) {
    if (typeof args[i] === 'function') {
      args[i] = global.zone.bind(args[i]);
    }
  }
  return args;
};

function bindArgumentsOnce(args) {
  for (var i = args.length - 1; i >= 0; i--) {
    if (typeof args[i] === 'function') {
      args[i] = global.zone.bindOnce(args[i]);
    }
  }
  return args;
};

function patchPrototype(obj, fnNames) {
  fnNames.forEach(function (name) {
    var delegate = obj[name];
    if (delegate) {
      obj[name] = function () {
        return delegate.apply(this, bindArguments(arguments));
      };
    }
  });
};

function patchProperty(obj, prop) {
  var desc = Object.getOwnPropertyDescriptor(obj, prop) || {
    enumerable: true,
    configurable: true
  };

  // A property descriptor cannot have getter/setter and be writable
  // deleting the writable and value properties avoids this error:
  //
  // TypeError: property descriptors must not specify a value or be writable when a
  // getter or setter has been specified
  delete desc.writable;
  delete desc.value;

  // substr(2) cuz 'onclick' -> 'click', etc
  var eventName = prop.substr(2);
  var _prop = '_' + prop;

  desc.set = function (fn) {
    if (this[_prop]) {
      this.removeEventListener(eventName, this[_prop]);
    }

    if (typeof fn === 'function') {
      this[_prop] = fn;
      this.addEventListener(eventName, fn, false);
    } else {
      this[_prop] = null;
    }
  };

  desc.get = function () {
    return this[_prop];
  };

  Object.defineProperty(obj, prop, desc);
};

function patchProperties(obj, properties) {

  (properties || (function () {
      var props = [];
      for (var prop in obj) {
        props.push(prop);
      }
      return props;
    }()).
    filter(function (propertyName) {
      return propertyName.substr(0,2) === 'on';
    })).
    forEach(function (eventName) {
      patchProperty(obj, eventName);
    });
};

function patchEventTargetMethods(obj) {
  var addDelegate = obj.addEventListener;
  obj.addEventListener = function (eventName, fn) {
    fn._bound = fn._bound || {};
    arguments[1] = fn._bound[eventName] = zone.bind(fn);
    return addDelegate.apply(this, arguments);
  };

  var removeDelegate = obj.removeEventListener;
  obj.removeEventListener = function (eventName, fn) {
    if(arguments[1]._bound && arguments[1]._bound[eventName]) {
      var _bound = arguments[1]._bound;
      arguments[1] = _bound[eventName];
      delete _bound[eventName];
    }
    var result = removeDelegate.apply(this, arguments);
    global.zone.dequeueTask(fn);
    return result;
  };
};

// wrap some native API on `window`
function patchClass(className) {
  var OriginalClass = global[className];
  if (!OriginalClass) return;

  global[className] = function () {
    var a = bindArguments(arguments);
    switch (a.length) {
      case 0: this._o = new OriginalClass(); break;
      case 1: this._o = new OriginalClass(a[0]); break;
      case 2: this._o = new OriginalClass(a[0], a[1]); break;
      case 3: this._o = new OriginalClass(a[0], a[1], a[2]); break;
      case 4: this._o = new OriginalClass(a[0], a[1], a[2], a[3]); break;
      default: throw new Error('what are you even doing?');
    }
  };

  var instance = new OriginalClass();

  var prop;
  for (prop in instance) {
    (function (prop) {
      if (typeof instance[prop] === 'function') {
        global[className].prototype[prop] = function () {
          return this._o[prop].apply(this._o, arguments);
        };
      } else {
        Object.defineProperty(global[className].prototype, prop, {
          set: function (fn) {
            if (typeof fn === 'function') {
              this._o[prop] = global.zone.bind(fn);
            } else {
              this._o[prop] = fn;
            }
          },
          get: function () {
            return this._o[prop];
          }
        });
      }
    }(prop));
  }

  for (prop in OriginalClass) {
    if (prop !== 'prototype' && OriginalClass.hasOwnProperty(prop)) {
      global[className][prop] = OriginalClass[prop];
    }
  }
};

module.exports = {
  bindArguments: bindArguments,
  bindArgumentsOnce: bindArgumentsOnce,
  patchPrototype: patchPrototype,
  patchProperty: patchProperty,
  patchProperties: patchProperties,
  patchEventTargetMethods: patchEventTargetMethods,
  patchClass: patchClass
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],27:[function(require,module,exports){
(function (global){
'use strict';

var core = require('./core');
var browserPatch = require('./patch/browser');

global.zone = new core.Zone();

module.exports = {
  Zone: core.Zone,
  zone: global.zone
};

browserPatch.apply();


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./core":15,"./patch/browser":16}],28:[function(require,module,exports){
// jshint newcap: false
/* global require, module, document, Element */
'use strict';

var VNode = require('./vnode');
var is = require('./is');

function isUndef(s) { return s === undefined; }

function emptyNodeAt(elm) {
  return VNode(elm.tagName, {}, [], undefined, elm);
}

var emptyNode = VNode('', {}, [], undefined, undefined);

var insertedVnodeQueue;

function sameVnode(vnode1, vnode2) {
  return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
}

function createKeyToOldIdx(children, beginIdx, endIdx) {
  var i, map = {}, key;
  for (i = beginIdx; i <= endIdx; ++i) {
    key = children[i].key;
    if (!isUndef(key)) map[key] = i;
  }
  return map;
}

function createRmCb(parentElm, childElm, listeners) {
  return function() {
    if (--listeners === 0) parentElm.removeChild(childElm);
  };
}

var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];

function init(modules) {
  var i, j, cbs = {};
  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = [];
    for (j = 0; j < modules.length; ++j) {
      if (modules[j][hooks[i]] !== undefined) cbs[hooks[i]].push(modules[j][hooks[i]]);
    }
  }

  function createElm(vnode) {
    var i, data = vnode.data;
    if (!isUndef(data)) {
      if (!isUndef(i = data.hook) && !isUndef(i = i.init)) i(vnode);
      if (!isUndef(i = data.vnode)) vnode = i;
    }
    var elm, children = vnode.children, sel = vnode.sel;
    if (!isUndef(sel)) {
      // Parse selector
      var hashIdx = sel.indexOf('#');
      var dotIdx = sel.indexOf('.', hashIdx);
      var hash = hashIdx > 0 ? hashIdx : sel.length;
      var dot = dotIdx > 0 ? dotIdx : sel.length;
      var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
      elm = vnode.elm = !isUndef(data) && !isUndef(i = data.ns) ? document.createElementNS(i, tag)
                                                                : document.createElement(tag);
      if (hash < dot) elm.id = sel.slice(hash + 1, dot);
      if (dotIdx > 0) elm.className = sel.slice(dot+1).replace(/\./g, ' ');
      if (is.array(children)) {
        for (i = 0; i < children.length; ++i) {
          elm.appendChild(createElm(children[i]));
        }
      } else if (is.primitive(vnode.text)) {
        elm.appendChild(document.createTextNode(vnode.text));
      }
      for (i = 0; i < cbs.create.length; ++i) cbs.create[i](emptyNode, vnode);
      i = vnode.data.hook; // Reuse variable
      if (!isUndef(i)) {
        if (i.create) i.create(emptyNode, vnode);
        if (i.insert) insertedVnodeQueue.push(vnode);
      }
    } else {
      elm = vnode.elm = document.createTextNode(vnode.text);
    }
    return vnode.elm;
  }

  function addVnodes(parentElm, before, vnodes, startIdx, endIdx) {
    for (; startIdx <= endIdx; ++startIdx) {
      parentElm.insertBefore(createElm(vnodes[startIdx]), before);
    }
  }

  function invokeDestroyHook(vnode) {
    var i = vnode.data, j;
    if (!isUndef(i)) {
      if (!isUndef(i = i.hook) && !isUndef(i = i.destroy)) i(vnode);
      for (i = 0; i < cbs.destroy.length; ++i) cbs.destroy[i](vnode);
      if (!isUndef(i = vnode.children)) {
        for (j = 0; j < vnode.children.length; ++j) {
          invokeDestroyHook(vnode.children[j]);
        }
      }
    }
  }

  function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
    for (; startIdx <= endIdx; ++startIdx) {
      var i, listeners, rm, ch = vnodes[startIdx];
      if (!isUndef(ch)) {
        invokeDestroyHook(ch);
        listeners = cbs.remove.length + 1;
        rm = createRmCb(parentElm, ch.elm, listeners);
        for (i = 0; i < cbs.remove.length; ++i) cbs.remove[i](ch, rm);
        if (!isUndef(i = ch.data) && !isUndef(i = i.hook) && !isUndef(i = i.remove)) {
          i(ch, rm);
        } else {
          rm();
        }
      }
    }
  }

  function updateChildren(parentElm, oldCh, newCh) {
    var oldStartIdx = 0, newStartIdx = 0;
    var oldEndIdx = oldCh.length - 1;
    var oldStartVnode = oldCh[0];
    var oldEndVnode = oldCh[oldEndIdx];
    var newEndIdx = newCh.length - 1;
    var newStartVnode = newCh[0];
    var newEndVnode = newCh[newEndIdx];
    var oldKeyToIdx, idxInOld, elmToMove, before;

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (isUndef(oldStartVnode)) {
        oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
      } else if (isUndef(oldEndVnode)) {
        oldEndVnode = oldCh[--oldEndIdx];
      } else if (sameVnode(oldStartVnode, newStartVnode)) {
        patchVnode(oldStartVnode, newStartVnode);
        oldStartVnode = oldCh[++oldStartIdx];
        newStartVnode = newCh[++newStartIdx];
      } else if (sameVnode(oldEndVnode, newEndVnode)) {
        patchVnode(oldEndVnode, newEndVnode);
        oldEndVnode = oldCh[--oldEndIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
        patchVnode(oldStartVnode, newEndVnode);
        parentElm.insertBefore(oldStartVnode.elm, oldEndVnode.elm.nextSibling);
        oldStartVnode = oldCh[++oldStartIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
        patchVnode(oldEndVnode, newStartVnode);
        parentElm.insertBefore(oldEndVnode.elm, oldStartVnode.elm);
        oldEndVnode = oldCh[--oldEndIdx];
        newStartVnode = newCh[++newStartIdx];
      } else {
        if (isUndef(oldKeyToIdx)) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
        idxInOld = oldKeyToIdx[newStartVnode.key];
        if (isUndef(idxInOld)) { // New element
          parentElm.insertBefore(createElm(newStartVnode), oldStartVnode.elm);
          newStartVnode = newCh[++newStartIdx];
        } else {
          elmToMove = oldCh[idxInOld];
          patchVnode(elmToMove, newStartVnode);
          oldCh[idxInOld] = undefined;
          parentElm.insertBefore(elmToMove.elm, oldStartVnode.elm);
          newStartVnode = newCh[++newStartIdx];
        }
      }
    }
    if (oldStartIdx > oldEndIdx) {
      before = isUndef(newCh[newEndIdx+1]) ? null : newCh[newEndIdx+1].elm;
      addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx);
    } else if (newStartIdx > newEndIdx) {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }
  }

  function patchVnode(oldVnode, vnode) {
    var i, hook;
    if (!isUndef(i = vnode.data) && !isUndef(hook = i.hook) && !isUndef(i = hook.prepatch)) {
      i(oldVnode, vnode);
    }
    if (!isUndef(i = oldVnode.data) && !isUndef(i = i.vnode)) oldVnode = i;
    if (!isUndef(i = vnode.data) && !isUndef(i = i.vnode)) vnode = i;
    var elm = vnode.elm = oldVnode.elm, oldCh = oldVnode.children, ch = vnode.children;
    if (oldVnode === vnode) return;
    if (!isUndef(vnode.data)) {
      for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode);
      i = vnode.data.hook;
      if (!isUndef(i) && !isUndef(i = i.update)) i(oldVnode, vnode);
    }
    if (isUndef(vnode.text)) {
      if (!isUndef(oldCh) && !isUndef(ch)) {
        if (oldCh !== ch) updateChildren(elm, oldCh, ch);
      } else if (!isUndef(ch)) {
        addVnodes(elm, null, ch, 0, ch.length - 1);
      } else if (!isUndef(oldCh)) {
        removeVnodes(elm, oldCh, 0, oldCh.length - 1);
      }
    } else if (oldVnode.text !== vnode.text) {
      elm.textContent = vnode.text;
    }
    if (!isUndef(hook) && !isUndef(i = hook.postpatch)) {
      i(oldVnode, vnode);
    }
    return vnode;
  }

  return function(oldVnode, vnode) {
    var i;
    insertedVnodeQueue = [];
    for (i = 0; i < cbs.pre.length; ++i) cbs.pre[i]();
    if (oldVnode instanceof Element) {
      if (oldVnode.parentElement !== null) {
        createElm(vnode);
        oldVnode.parentElement.replaceChild(vnode.elm, oldVnode);
      } else {
        oldVnode = emptyNodeAt(oldVnode);
        patchVnode(oldVnode, vnode);
      }
    } else {
      patchVnode(oldVnode, vnode);
    }
    for (i = 0; i < insertedVnodeQueue.length; ++i) {
      insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
    }
    insertedVnodeQueue = undefined;
    for (i = 0; i < cbs.post.length; ++i) cbs.post[i]();
    return vnode;
  };
}

module.exports = {init: init};

},{"./is":7,"./vnode":29}],29:[function(require,module,exports){
module.exports = function(sel, data, children, text, elm) {
  var key = data === undefined ? undefined : data.key;
  return {sel: sel, data: data, children: children,
          text: text, elm: elm, key: key};
};

},{}]},{},[2]);

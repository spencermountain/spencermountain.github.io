(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const el = require('redom').el;

const isObject = (a) => Object.prototype.toString.call(a) === '[object Object]'
const isArray = (a) => Object.prototype.toString.call(a) === '[object Array]'
const isString = (a) => typeof a === 'string'

const toObject = function(str) {
  var result = {}
  var attributes = str.split(';');
  for (var i = 0; i < attributes.length; i++) {
    var entry = attributes[i].split(':');
    result[entry.splice(0, 1)[0].trim()] = entry.join(':');
  }
  // console.log(result)
  return result
}

const div = (a, b, c) => {
  let attr = {}
  let inside = []
  //class, attr, children
  if (a && b && isString(a) && isObject(b)) {
    attr = b
    attr.class = a
    inside = c
  } else if (a && b && isString(a) && isString(b) && b.indexOf(':') !== -1) {
    let style = toObject(b)
    //class, style, children
    attr = {
      class: a,
      style: style
    }
    inside = c
  } else if (a && b && isString(a) && (isArray(b) || isString(b))) {
    attr = {
      class: a
    }
    inside = b
  } else {
    attr = a
    inside = b
  }
  return el('div', attr, inside);
}

module.exports = div

},{"redom":5}],2:[function(require,module,exports){
const el = require('redom').el;

//src, class
const img = (src, attr) => {
  if (typeof attr === 'string') {
    attr = {
      class: attr
    }
  }
  attr = attr || {}
  attr.src = src
  return el('img', attr);
}

module.exports = img

},{"redom":5}],3:[function(require,module,exports){
const el = require('redom').el;

//src, class
const link = (href, attr, inside) => {
  if (typeof attr === 'string') {
    attr = {
      class: attr
    }
  }
  attr = attr || {}
  attr.href = href
  console.log(attr)
  return el('a', attr, inside);
}

module.exports = link

},{"redom":5}],4:[function(require,module,exports){
const el = require('redom').el;

const isObject = (a) => Object.prototype.toString.call(a) === '[object Object]'
const isArray = (a) => Object.prototype.toString.call(a) === '[object Array]'
const isString = (a) => typeof a === 'string'

const toObject = function(str) {
  var result = {}
  var attributes = str.split(';');
  for (var i = 0; i < attributes.length; i++) {
    var entry = attributes[i].split(':');
    result[entry.splice(0, 1)[0].trim()] = entry.join(':');
  }
  // console.log(result)
  return result
}

const div = (a, b, c) => {
  let attr = {}
  let inside = []
  //class, attr, children
  if (a && b && isString(a) && isObject(b)) {
    attr = b
    attr.class = a
    inside = c
  } else if (a && b && isString(a) && isString(b) && b.indexOf(':') !== -1) {
    let style = toObject(b)
    //class, style, children
    attr = {
      class: a,
      style: style
    }
    inside = c
  } else if (a && b && isString(a) && (isArray(b) || isString(b))) {
    attr = {
      class: a
    }
    inside = b
  } else {
    attr = a
    inside = b
  }
  return el('span', attr, inside);
}

module.exports = div

},{"redom":5}],5:[function(require,module,exports){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.redom = {})));
}(this, (function (exports) { 'use strict';

var HASH = '#'.charCodeAt(0);
var DOT = '.'.charCodeAt(0);

var TAGNAME = 0;
var ID = 1;
var CLASSNAME = 2;

var parseQuery = function (query) {
  var tag = null;
  var id = null;
  var className = null;
  var mode = TAGNAME;
  var buffer = '';

  for (var i = 0; i <= query.length; i++) {
    var char = query.charCodeAt(i);
    var isHash = char === HASH;
    var isDot = char === DOT;
    var isEnd = !char;

    if (isHash || isDot || isEnd) {
      if (mode === TAGNAME) {
        if (i === 0) {
          tag = 'div';
        } else {
          tag = buffer;
        }
      } else if (mode === ID) {
        id = buffer;
      } else {
        if (className) {
          className += ' ' + buffer;
        } else {
          className = buffer;
        }
      }

      if (isHash) {
        mode = ID;
      } else if (isDot) {
        mode = CLASSNAME;
      }

      buffer = '';
    } else {
      buffer += query[i];
    }
  }

  return { tag: tag, id: id, className: className };
};

var createElement = function (query, ns) {
  var ref = parseQuery(query);
  var tag = ref.tag;
  var id = ref.id;
  var className = ref.className;
  var element = ns ? document.createElementNS(ns, tag) : document.createElement(tag);

  if (id) {
    element.id = id;
  }

  if (className) {
    if (ns) {
      element.setAttribute('class', className);
    } else {
      element.className = className;
    }
  }

  return element;
};

var unmount = function (parent, child) {
  var parentEl = getEl(parent);
  var childEl = getEl(child);

  if (child === childEl && childEl.__redom_view) {
    // try to look up the view if not provided
    child = childEl.__redom_view;
  }

  if (childEl.parentNode) {
    doUnmount(child, childEl, parentEl);

    parentEl.removeChild(childEl);
  }

  return child;
};

var doUnmount = function (child, childEl, parentEl) {
  var hooks = childEl.__redom_lifecycle;

  if (!hooks) {
    childEl.__redom_mounted = false;
    return;
  }

  var traverse = parentEl;

  if (childEl.__redom_mounted) {
    trigger(childEl, 'onunmount');
  }

  while (traverse) {
    var parentHooks = traverse.__redom_lifecycle || (traverse.__redom_lifecycle = {});
    var hooksFound = false;

    for (var hook in hooks) {
      if (parentHooks[hook]) {
        parentHooks[hook] -= hooks[hook];
      }
      if (parentHooks[hook]) {
        hooksFound = true;
      }
    }

    if (!hooksFound) {
      traverse.__redom_lifecycle = null;
    }

    traverse = traverse.parentNode;
  }
};

var hookNames = ['onmount', 'onunmount'];

var mount = function (parent, child, before) {
  var parentEl = getEl(parent);
  var childEl = getEl(child);

  if (child === childEl && childEl.__redom_view) {
    // try to look up the view if not provided
    child = childEl.__redom_view;
  }

  if (child !== childEl) {
    childEl.__redom_view = child;
  }

  var wasMounted = childEl.__redom_mounted;
  var oldParent = childEl.parentNode;

  if (wasMounted && (oldParent !== parentEl)) {
    doUnmount(child, childEl, oldParent);
  }

  if (before != null) {
    parentEl.insertBefore(childEl, getEl(before));
  } else {
    parentEl.appendChild(childEl);
  }

  doMount(child, childEl, parentEl, oldParent);

  return child;
};

var doMount = function (child, childEl, parentEl, oldParent) {
  var hooks = childEl.__redom_lifecycle || (childEl.__redom_lifecycle = {});
  var remount = (parentEl === oldParent);
  var hooksFound = false;

  for (var i = 0; i < hookNames.length; i++) {
    var hookName = hookNames[i];

    if (!remount && (child !== childEl) && (hookName in child)) {
      hooks[hookName] = (hooks[hookName] || 0) + 1;
    }
    if (hooks[hookName]) {
      hooksFound = true;
    }
  }

  if (!hooksFound) {
    childEl.__redom_mounted = true;
    return;
  }

  var traverse = parentEl;
  var triggered = false;

  if (remount || (!triggered && (traverse && traverse.__redom_mounted))) {
    trigger(childEl, remount ? 'onremount' : 'onmount');
    triggered = true;
  }

  if (remount) {
    return;
  }

  while (traverse) {
    var parent = traverse.parentNode;
    var parentHooks = traverse.__redom_lifecycle || (traverse.__redom_lifecycle = {});

    for (var hook in hooks) {
      parentHooks[hook] = (parentHooks[hook] || 0) + hooks[hook];
    }

    if (!triggered && (traverse === document || (parent && parent.__redom_mounted))) {
      trigger(traverse, remount ? 'onremount' : 'onmount');
      triggered = true;
    }

    traverse = parent;
  }
};

var trigger = function (el, eventName) {
  if (eventName === 'onmount') {
    el.__redom_mounted = true;
  } else if (eventName === 'onunmount') {
    el.__redom_mounted = false;
  }

  var hooks = el.__redom_lifecycle;

  if (!hooks) {
    return;
  }

  var view = el.__redom_view;
  var hookCount = 0;

  view && view[eventName] && view[eventName]();

  for (var hook in hooks) {
    if (hook) {
      hookCount++;
    }
  }

  if (hookCount) {
    var traverse = el.firstChild;

    while (traverse) {
      var next = traverse.nextSibling;

      trigger(traverse, eventName);

      traverse = next;
    }
  }
};

var setStyle = function (view, arg1, arg2) {
  var el = getEl(view);

  if (arg2 !== undefined) {
    el.style[arg1] = arg2;
  } else if (isString(arg1)) {
    el.setAttribute('style', arg1);
  } else {
    for (var key in arg1) {
      setStyle(el, key, arg1[key]);
    }
  }
};

/* global SVGElement */

var xlinkns = 'http://www.w3.org/1999/xlink';

var setAttr = function (view, arg1, arg2) {
  var el = getEl(view);
  var isSVG = el instanceof SVGElement;

  if (arg2 !== undefined) {
    if (arg1 === 'style') {
      setStyle(el, arg2);
    } else if (isSVG && isFunction(arg2)) {
      el[arg1] = arg2;
    } else if (!isSVG && (arg1 in el || isFunction(arg2))) {
      el[arg1] = arg2;
    } else {
      if (isSVG && (arg1 === 'xlink')) {
        setXlink(el, arg2);
        return;
      }
      el.setAttribute(arg1, arg2);
    }
  } else {
    for (var key in arg1) {
      setAttr(el, key, arg1[key]);
    }
  }
};

function setXlink (el, obj) {
  for (var key in obj) {
    el.setAttributeNS(xlinkns, key, obj[key]);
  }
}

var text = function (str) { return document.createTextNode(str); };

var parseArguments = function (element, args) {
  for (var i = 0; i < args.length; i++) {
    var arg = args[i];

    if (arg !== 0 && !arg) {
      continue;
    }

    // support middleware
    if (typeof arg === 'function') {
      arg(element);
    } else if (isString(arg) || isNumber(arg)) {
      element.appendChild(text(arg));
    } else if (isNode(getEl(arg))) {
      mount(element, arg);
    } else if (arg.length) {
      parseArguments(element, arg);
    } else if (typeof arg === 'object') {
      setAttr(element, arg);
    }
  }
};

var ensureEl = function (parent) { return isString(parent) ? html(parent) : getEl(parent); };
var getEl = function (parent) { return (parent.nodeType && parent) || (!parent.el && parent) || getEl(parent.el); };

var isString = function (a) { return typeof a === 'string'; };
var isNumber = function (a) { return typeof a === 'number'; };
var isFunction = function (a) { return typeof a === 'function'; };

var isNode = function (a) { return a && a.nodeType; };

var htmlCache = {};

var memoizeHTML = function (query) { return htmlCache[query] || (htmlCache[query] = createElement(query)); };

var html = function (query) {
  var args = [], len = arguments.length - 1;
  while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

  var element;

  if (isString(query)) {
    element = memoizeHTML(query).cloneNode(false);
  } else if (isNode(query)) {
    element = query.cloneNode(false);
  } else {
    throw new Error('At least one argument required');
  }

  parseArguments(element, args);

  return element;
};

html.extend = function (query) {
  var args = [], len = arguments.length - 1;
  while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

  var clone = memoizeHTML(query);

  return html.bind.apply(html, [ this, clone ].concat( args ));
};

var el = html;
var h = html;

var setChildren = function (parent, children) {
  if (children.length === undefined) {
    return setChildren(parent, [children]);
  }

  var parentEl = getEl(parent);
  var traverse = parentEl.firstChild;

  for (var i = 0; i < children.length; i++) {
    var child = children[i];

    if (!child) {
      continue;
    }

    var childEl = getEl(child);

    if (childEl === traverse) {
      traverse = traverse.nextSibling;
      continue;
    }

    mount(parent, child, traverse);
  }

  while (traverse) {
    var next = traverse.nextSibling;

    unmount(parent, traverse);

    traverse = next;
  }
};

var propKey = function (key) { return function (item) { return item[key]; }; };

var list = function (parent, View, key, initData) {
  return new List(parent, View, key, initData);
};

var List = function List (parent, View, key, initData) {
  this.__redom_list = true;
  this.View = View;
  this.initData = initData;
  this.views = [];
  this.el = ensureEl(parent);

  if (key != null) {
    this.lookup = {};
    this.key = isFunction(key) ? key : propKey(key);
  }
};
List.prototype.update = function update (data, context) {
    var this$1 = this;
    if ( data === void 0 ) data = [];

  var View = this.View;
  var key = this.key;
  var keySet = key != null;
  var initData = this.initData;
  var newViews = new Array(data.length);
  var oldViews = this.views;
  var newLookup = key && {};
  var oldLookup = key && this.lookup;

  for (var i = 0; i < data.length; i++) {
    var item = data[i];
    var view = (void 0);

    if (keySet) {
      var id = key(item);
      view = oldLookup[id] || new View(initData, item, i, data);
      newLookup[id] = view;
      view.__redom_id = id;
    } else {
      view = oldViews[i] || new View(initData, item, i, data);
    }
    newViews[i] = view;
    var el = getEl(view.el);
    el.__redom_view = view;
    view.update && view.update(item, i, data, context);
  }

  if (keySet) {
    for (var i$1 = 0; i$1 < oldViews.length; i$1++) {
      var id$1 = oldViews[i$1].__redom_id;
      if (!(id$1 in newLookup)) {
        unmount(this$1, oldLookup[id$1]);
      }
    }
  }

  setChildren(this, newViews);

  if (keySet) {
    this.lookup = newLookup;
  }
  this.views = newViews;
};

List.extend = function (parent, View, key, initData) {
  return List.bind(List, parent, View, key, initData);
};

list.extend = List.extend;

/* global Node */

var place = function (View, initData) {
  return new Place(View, initData);
};

var Place = function Place (View, initData) {
  this.el = text('');
  this.visible = false;
  this.view = null;
  this._placeholder = this.el;
  if (View instanceof Node) {
    this._el = View;
  } else {
    this._View = View;
  }
  this._initData = initData;
};
Place.prototype.update = function update (visible, data) {
  var placeholder = this._placeholder;
  var parentNode = this.el.parentNode;

  if (visible) {
    if (!this.visible) {
      if (this._el) {
        mount(parentNode, this._el, placeholder);
        unmount(parentNode, placeholder);
        this.el = this._el;
        this.visible = visible;
        return;
      }
      var View = this._View;
      var view = new View(this._initData);

      this.el = getEl(view);
      this.view = view;

      mount(parentNode, view, placeholder);
      unmount(parentNode, placeholder);
    }
    this.view && this.view.update && this.view.update(data);
  } else {
    if (this.visible) {
      if (this._el) {
        mount(parentNode, placeholder, this._el);
        unmount(parentNode, this._el);
        this.el = placeholder;
        this.visible = visible;
        return;
      }
      mount(parentNode, placeholder, this.view);
      unmount(parentNode, this.view);

      this.el = placeholder;
      this.view = null;
    }
  }
  this.visible = visible;
};

var router = function (parent, Views, initData) {
  return new Router(parent, Views, initData);
};

var Router = function Router (parent, Views, initData) {
  this.el = ensureEl(parent);
  this.Views = Views;
  this.initData = initData;
};
Router.prototype.update = function update (route, data) {
  if (route !== this.route) {
    var Views = this.Views;
    var View = Views[route];

    this.view = View && new View(this.initData, data);
    this.route = route;

    setChildren(this.el, [ this.view ]);
  }
  this.view && this.view.update && this.view.update(data, route);
};

var ns = 'http://www.w3.org/2000/svg';

var svgCache = {};

var memoizeSVG = function (query) { return svgCache[query] || (svgCache[query] = createElement(query, ns)); };

var svg = function (query) {
  var args = [], len = arguments.length - 1;
  while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

  var element;

  if (isString(query)) {
    element = memoizeSVG(query).cloneNode(false);
  } else if (isNode(query)) {
    element = query.cloneNode(false);
  } else {
    throw new Error('At least one argument required');
  }

  parseArguments(element, args);

  return element;
};

svg.extend = function (query) {
  var clone = memoizeSVG(query);

  return svg.bind(this, clone);
};

svg.ns = ns;

var s = svg;

exports.el = el;
exports.h = h;
exports.html = html;
exports.list = list;
exports.List = List;
exports.mount = mount;
exports.unmount = unmount;
exports.place = place;
exports.Place = Place;
exports.router = router;
exports.Router = Router;
exports.setAttr = setAttr;
exports.setStyle = setStyle;
exports.setChildren = setChildren;
exports.s = s;
exports.svg = svg;
exports.text = text;

Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}],6:[function(require,module,exports){
const div = require('../../lib/div')
const span = require('../../lib/span')
const img = require('../../lib/img')
const link = require('../../lib/link')

class Main {
  constructor() {
    this.el = div('w-100 tc flex justify-center items-center flex-wrap', 'min-height:30rem;', [
      div(' ', 'flex:1; min-width:10rem; max-width:15rem;', [
        div("Spencer Kelly"),
        div('pt2', "a software developer"),
      ]),
      div('h-100 relative', 'flex:1; min-width:15rem; max-width:30rem;', [
        img('./src/01-hello/starter.png', 'br3 shadow-1'),
        div('flex flex-column justify-start  items-start absolute', 'top:15%; left:45%; flex:1; width:50%;', [
          // div('ml3', ['work:']),
          this.project('http://compromise.cool', './src/07-github/img/nlp-compromise.png', 'nlp-compromise', 'grammar processing'),
          this.project('https://github.com/spencermountain/wtf_wikipedia', './src/07-github/img/wtf-wikipedia.png', 'wtf-wikipedia', 'wikipedia parser'),
          this.project('https://github.com/spencermountain/spacetime', './src/07-github/img/spacetime.png', 'spacetime', 'timezone support')

        ]),
      ])
    ])

  }
  project(href, src, title, desc) {
    return div('flex justify-center items-center tl black mt2 mt3-m mt4-ns tl ml3 link pointer', [
      // link(href, img(src, 'w2 w1 pa1')),
      link(href, [
        div('grow mb1', 'font-weight:700; font-size:18px; color:#4e6b87; white-space: nowrap', [
          // span('pa1', '  • '),
          span('m1', 'padding-right:5px; padding-left:5px; border-bottom:2px solid #bc8594;', title)
        ]),
        div('ml1 mt2', 'color:grey; margin-left:1.8rem;', desc),
      ]),
    ])
  }
}
module.exports = Main

},{"../../lib/div":1,"../../lib/img":2,"../../lib/link":3,"../../lib/span":4}],7:[function(require,module,exports){
const div = require('../../lib/div')
// const span = require('../../lib/span')
const img = require('../../lib/img')
const flair = require('../lib/flair')
class Main {
  constructor() {
    this.el = div('tc items-center justify-around', 'flex:1; width: 80%; max-width:60rem;', [
      div('relative flex items-center', 'left:20%; max-width:50%; width:30rem;', [
        flair(["#e6b3c1", "#b3e6d8", "#e6d8b3", "#6699cc"], 0.5),
        div('grey mt2 ml5 pl2 f5', 'white-space:nowrap;', 'Toronto, Canada')
      ]),
      div('flex items-center justify-between', [
        img('./src/02-show/things/rowers.gif', {
          class: 'w4 w5-ns br3 shadow-1'
        }),
        img('./src/02-show/things/compost.png', {
          class: 'w4 w5-ns br3 shadow-1 mt5'
        }),
      ])
    ])
  }

}
module.exports = Main

},{"../../lib/div":1,"../../lib/img":2,"../lib/flair":10}],8:[function(require,module,exports){
const div = require('../../lib/div')
const span = require('../../lib/span')
const flair = require('../lib/flair')
class Main {
  constructor() {
    this.el = div('tc items-center justify-around', 'flex:1; width:80%; min-height:30rem; max-width:60rem; background-color:#fafaff;', [
      div('relative pt4', 'left:10%; max-width:80%; width:80%;', [
        flair(["#cc8a66", "#66a8cc", "#66dc88", "#afcc66"], 1)
      ]),
      div('flex justify-center flex-wrap items-start tc mt4 pt5', [
        div('grey nowrap', 'font-size:1.5rem; color:#bacbe0;', 'What confuses me:'),
        div('pt4 w6 tl', 'position:relative;', [
          this.blog('Electricity in air', 0),
          this.blog('Internet bandwidth', -5),
          this.blog('Compound growth', 1),
          this.blog('Cooking oil', 2),
        ])
      ]),
      div('flex justify-start flex-wrap items-start tc pt4 ml5', [
        div('grey nowrap', 'font-size:1.5rem; color:#bacbe0;', 'I\'m reading about:'),
        div('pt4 w6 tl', 'position:relative;', [
          this.blog('Electricity in air', 0),
          this.blog('Internet bandwidth', -5)
        ])
      ])
    ])
  }
  blog(title, left) {
    return div('pa2 f4 w6 link pointer', `margin-left:${left}rem;`, [
      // span('pa1', '  • '),
      span('pa1 underline fw2 f5', title),
    ])
  }

}
module.exports = Main

},{"../../lib/div":1,"../../lib/span":4,"../lib/flair":10}],9:[function(require,module,exports){
const el = require('redom').el;
const mount = require('redom').mount;
// require('web-animations-js/web-animations.min'); //polyfill

const Intro = require('./01-intro');
const Show = require('./02-show');
const Blog = require('./03-blog');
// const Hello = require('./01-hello');
// const Born = require('./03-born');
// const Tree = require('./04-tree');
// const Mistakes = require('./05-mistakes');
// const Swim = require('./06-swim');
// const Github = require('./07-github');
// const Today = require('./08-today');
// const Contact = require('./09-contact');

const css = {
  container: {
    display: 'flex',
    'flex-direction': 'column',
    'text-align': 'center',
    'align-items': 'center',
    'align-content': 'center'
  }
};

class App {
  constructor() {
    this.el = el(
      '#app',
      {
        style: css.container
      },
      [
        new Intro(),
        new Show(),
        new Blog(),
      // new Hello(),
      // new Born(),
      // new Tree(),
      // new Mistakes(),
      // new Swim(),
      // new Github(),
      // new Today(),
      // new Contact(),
      ]
    );
  }
}

const app = new App();
mount(document.body, app);

},{"./01-intro":6,"./02-show":7,"./03-blog":8,"redom":5}],10:[function(require,module,exports){
const div = require('../../lib/div')

const flair = (colors, height) => {
  height = height || 1.2
  return div('flex justify-around items-center tc mt3', `width:100%; height:${height}rem; overflow:hidden; border-radius:5px;`, colors.map((c) => {
    let r = 1
    if (Math.random() > 0.5) {
      r = 1.5
    }
    return div({
      style: `flex:${r}; height:100%; background-color:${c};`
    })
  })
  )
}

module.exports = flair

},{"../../lib/div":1}]},{},[9]);

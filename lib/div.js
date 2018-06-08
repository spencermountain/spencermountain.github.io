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

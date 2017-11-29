const el = require('redom').el;

const isObject = (a) => Object.prototype.toString.call(a) === '[object Object]'
const isArray = (a) => Object.prototype.toString.call(a) === '[object Array]'

const div = (attr, inside, c) => {
  return el('div', attr, inside);
}

module.exports = div

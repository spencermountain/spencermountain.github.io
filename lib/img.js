const el = require('redom').el;

const img = (src, attr) => {
  if (typeof src !== 'string') {
    let tmp = src
    src = attr
    attr = tmp
  }
  attr = attr || {}
  attr.src = src
  return el('img', attr);
}

module.exports = img

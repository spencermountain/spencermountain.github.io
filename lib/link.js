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
  return el('a', attr, inside);
}

module.exports = link

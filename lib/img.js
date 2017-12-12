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

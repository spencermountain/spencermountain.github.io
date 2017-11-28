const el = require('redom').el;

const div = (attr, inside) => {
  if (inside && typeof inside === 'function') {
    inside = inside() //run it
  }
  return el('div', attr, inside);
}

module.exports = div

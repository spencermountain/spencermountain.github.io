const el = require('redom').el;

//src, class
const video = (src, attr) => {
  if (typeof attr === 'string') {
    attr = {
      class: attr
    }
  }
  attr = attr || {}
  attr.src = src
  //defaults
  if (attr.autoplay === undefined) {
    attr.autoplay = true
  }
  if (attr.muted === undefined) {
    attr.muted = true
  }
  return el('video', attr);
}

module.exports = video

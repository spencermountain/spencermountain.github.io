const glamor = require('glamor').css
const styler = require('react-styling');

//combine the sloppy-syntax of styler, and inline-rendering of glamor
const style = function(str) {
  let obj = styler(str)
  Object.keys(obj).forEach((k) => {
    obj[k] = glamor(obj[k])
  })
  return obj
}
module.exports = style

const htm = require('htm')
const h = htm.bind(require('vhtml'))

const tweens = {
  top: () => {
    var logo = document.querySelector('#pink')
    let newEl = h`<div class="slider bgnavy h100p"></div>`
    logo.innerHTML = newEl
  }
}

document.body.addEventListener(
  'click',
  () => {
    tweens.top()
  },
  true
)

module.exports = tweens

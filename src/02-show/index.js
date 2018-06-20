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

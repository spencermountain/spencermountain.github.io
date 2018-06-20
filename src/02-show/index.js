const div = require('../../lib/div')
const img = require('../../lib/img')
const flair = require('../lib/flair')
class Main {
  constructor() {
    this.el = div([
      div({
        class: 'flex items-center justify-around'
      }, [
        img('./src/02-show/things/rowers.gif', {
          class: 'w4 w5-ns br3 shadow-1'
        }),
        img('./src/02-show/things/compost.png', {
          class: 'w4 w5-ns br3 shadow-1 mt5'
        }),
      ]),
      div('relative', 'left:40%; max-width:50%; width:25rem;', [
        flair(["#e6b3c1", "#b3e6d8", "#e6d8b3", "#6699cc"])
      ])
    ])
  }

}
module.exports = Main

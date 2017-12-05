const pug = require('pug')
const div = require('../../lib/div')
const img = require('../../lib/img')
const style = require('../../lib/style')
let css = style`
`

class Main {
  constructor() {
    this.el = div({
      class: 'flex items-center justify-around'
    }, [
      img('./src/show/things/rowers.gif', {
        class: 'w5 br3 shadow-1'
      }),
      img('./src/show/things/compost.png', {
        class: 'w5 br3 shadow-1 mt5'
      })
    ])

  }

}
module.exports = Main

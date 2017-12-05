const div = require('../../lib/div')
const img = require('../../lib/img')
const video = require('../../lib/video')
const style = require('../../lib/style')
let css = style`
`

class Main {
  constructor() {
    this.el = div('flex justify-around tc', [
      div('', [
        div('f3 light-purple', 'Did a philosophy degree'),
        div('mb2', '(that was a huge mistake)'),
        img('./src/mistakes/img/carpet.jpg', 'w5 br3 shadow-1'),
      ]),
      div('', [
        div('f3 green', 'Went to grad-school'),
        div('mb2', '(that was a huge mistake)'),
        img('./src/mistakes/img/table.png', 'w5 br3 shadow-1'),
      ]),
      div('', [
        div('f3 orange', 'Died my own hair'),
        div('mb2', '(that was a huge mistake)'),
        video('./src/mistakes/img/hairblue.mp4', 'w5 br3 shadow-1'),
      ])
    ])
  }
}
module.exports = Main

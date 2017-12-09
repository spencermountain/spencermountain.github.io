const div = require('../../lib/div')
const img = require('../../lib/img')
const video = require('../../lib/video')
const style = require('../../lib/style')
let css = style`
`

class Main {
  constructor() {
    this.el = div('ml3', [
      div('dim-gray', '2000 — 2010'),
      div('flex flex-wrap', [
        div('flex tc flex-wrap flex-column', [
          div('mt2 mb2 flex items-center', [
            img('./src/mistakes/img/carpet.jpg', 'w4 ma2 mw4 w-90 br3 shadow-1'),
            div('w5', [
              div('f3 red', 'got a philosophy degree'),
              div('mb2', '(huge mistake)'),
            ]),
          ]),
          div('mt2  mb2 flex items-center', [
            div('w5', [
              div('f3 green', 'went to grad-school'),
              div('mb2', '(huge mistake)'),
            ]),
            img('./src/mistakes/img/table.png', 'w4 mw4 w-90 br3 shadow-1'),
          ]),
        ]),
        div('ml5 tc mw5 mb2 flex flex-column items-center justify-center', [
          div('w5', [
            div('f3 blue', 'died my hair blue'),
            div('mb2 tr', 'for some reason.'),
            div('mb2 tc', '(huge mistake)'),
          ]),
          video('./src/mistakes/img/hairblue.mp4', 'w6-ns mw6 mw-100 br3 shadow-1'),
        ])
      ])
    ])
  }
}
module.exports = Main

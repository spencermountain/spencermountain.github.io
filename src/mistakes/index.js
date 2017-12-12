const div = require('../../lib/div')
const img = require('../../lib/img')
const video = require('../../lib/video')
const style = require('../../lib/style')
let css = style`
`

class Main {
  constructor() {
    this.el = div('ml3 ', [
      div('dark-gray f3', '1990-2000,'),
      div('flex flex-wrap', [
        div('flex tc flex-wrap flex-column', [
          div('mt2  mb2 flex items-center', [
            div('w5', [
              div('f3 blue avenir', 'compiled linux'),
              div('mb2', '(many mistakes)'),
            ]),
            img('./src/mistakes/img/linux.png', 'w4 mh2 mw4 w-90 br3 shadow-1'),
          ]),
          div('mt3 mb2 flex items-center', [
            img('./src/mistakes/img/carpet.jpg', 'w4 ma2 mw4 w-90 br3 shadow-1'),
            div('w5', [
              div('f3 red avenir', 'got a philosophy degree'),
              div('mb2', '(huge mistake)'),
            ]),
          ]),
          div('mt3  mb2 flex items-center', [
            div('w5', [
              div('f3 green avenir', 'went to grad-school'),
              div('mb2', '(obvious mistake)'),
            ]),
            img('./src/mistakes/img/table.png', 'w4 mh2 mw4 w-90 br3 shadow-1'),
          ]),
        ]),
        div('ml5 tc mw5 mb2 flex flex-column mt4 items-center justify-center', [
          div('w5', [
            div('f3 orange avenir', 'died my hair blue'),
            div('mb2 tc', '(clear mistake)'),
          ]),
          video('./src/mistakes/img/hairblue.mp4', 'w5 w6-ns mw6 mw-100 br3 shadow-1'),
          div('mb2 tr', 'for some reason.'),
        ]),
      ])
    ])
  }
}
module.exports = Main

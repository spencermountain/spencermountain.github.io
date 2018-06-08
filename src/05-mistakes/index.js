const div = require('../../lib/div')
const img = require('../../lib/img')
const video = require('../../lib/video')

class Main {
  constructor() {
    this.el = div('ml3 fw1', [
      div('f3 mh2 navy', '1990-'),
      div('flex flex-wrap', [
        div('flex tc flex-wrap flex-column', [
          div('mt2  mb2 flex items-center', [
            div('w5', [
              div('f3 blue avenir fw1', 'compiled linux'),
              div('mb2 fw1', '(many mistakes)'),
            ]),
            img('./src/05-mistakes/img/linux.png', 'w4 mh2 mw4 w-90 br3 shadow-1'),
          ]),
          div('mt3 mb2 flex items-center', [
            img('./src/05-mistakes/img/carpet.jpg', 'w4 ma2 mw4 w-90 br3 shadow-1'),
            div('w5', [
              div('f3 red avenir fw1', 'got a philosophy degree'),
              div('mb2 fw1', '(huge mistake)'),
            ]),
          ]),
          div('mt3  mb2 flex items-center', [
            div('w5', [
              div('f3 green avenir fw1', 'went to grad-school'),
              div('mb2 fw1', '(obvious mistake)'),
            ]),
            img('./src/05-mistakes/img/table.png', 'w4 mh2 mw4 w-90 br3 shadow-1'),
          ]),
        ]),
        div('ml5 tc mw5 mb2 flex flex-column mt4 items-center justify-center', [
          div('w5', [
            div('f3 orange avenir fw1', 'dyed my hair blue'),
            div('mb2 tc fw1', '(clear mistake)'),
          ]),
          video('./src/05-mistakes/img/hairblue.mp4', 'w5 w6-ns mw6 mr2 mw-100 br3 shadow-1'),
          div('mb2 tr', 'for some reason...'),
        ]),
      ])
    ])
  }
}
module.exports = Main

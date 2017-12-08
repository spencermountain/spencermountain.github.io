const div = require('../../lib/div')
const span = require('../../lib/span')
const img = require('../../lib/img')
const video = require('../../lib/video')
const style = require('../../lib/style')
let css = style``

class Main {
  constructor() {
    this.el = div('mt5', [
      div('f3 mh2 navy', 'the'),
      div('f1 mh2 navy', '1980s.'),
      div({
        class: 'f4 ml4'
      }, [
        'I was born in the soft-rock suburbs of ',
        span('light-red', 'canada'),
        span('', '.')
      ]),
      div('flex justify-between flex-wrap', [
        div('w4 w-25 pa4', {
          style: {
            'min-width': '150px'
          }
        }, [
          img('./src/born/img/brian-mulroney.png', {
            width: 100
          }),
          div({
            class: 'f5 mid-gray'
          }, 'Brian Mulroney was'),
          div({
            class: 'f5 mid-gray'
          }, 'prime-minister'),
        ]),
        div('w1 w-75 flex items-center center justify-center pl2', {
          style: {
            'min-width': '400px'
          }
        }, [
          div('mw4 f5 tr lh-copy mr2 mid-gray', 'communism was still basically a really huge thing but I didn\'t understand it because I'),
          video('./src/born/img/stairsTwo.mp4', 'w4 w5-ns'),
          div('f1 ml2 mw4 lh-copy mid-gray', 'was little')
        ])
      ])
    ])
  }

}
module.exports = Main

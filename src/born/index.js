const div = require('../../lib/div')
const span = require('../../lib/span')
const img = require('../../lib/img')
const video = require('../../lib/video')

class Main {
  constructor() {
    this.el = div('mt5', [
      div('f3 mh2 navy', 'the'),
      div('f1 mh2 navy', '1980s.'),
      div({
        class: 'f4 ml4'
      }, [
        'was born in the soft-rock suburbs of ',
        span('light-red', 'canada'),
        span('', '.')
      ]),
      div('flex justify-between flex-wrap', [
        div('w4 w-25 pa4 center', {
          style: {
            'min-width': '150px'
          }
        }, [
          img('./src/born/img/brian-mulroney.png', {
            width: 100
          }),
          div({
            class: 'f4 blue'
          }, 'Brian Mulroney'),
          div({
            class: 'f5 ml2 near-black'
          }, 'was'),
          div({
            class: 'f4 ml2 near-black'
          }, 'prime-minister.'),
        ]),
        div('w1 w-75 flex items-center center justify-center pl2', {
          style: {
            'min-width': '300px'
          }
        }, [
          div('mw4 f5 tr lh-copy mr2 mid-gray', 'communism was still basically a really huge thing but I didn\'t understand because I'),
          video('./src/born/img/stairsTwo.mp4', 'w4 w5-ns'),
          div('f3 f2-ns ml2 mw4 lh-copy mid-gray', 'was really little')
        ])
      ])
    ])
  }

}
module.exports = Main

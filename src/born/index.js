const div = require('../../lib/div')
const img = require('../../lib/img')
const video = require('../../lib/video')
const style = require('../../lib/style')
let css = style``

class Main {
  constructor() {
    this.el = div('', [
      div({
        class: 'f1 ma2'
      }, '1980s'),
      div({
        class: 'f4 ml4'
      }, 'I was born in the suburbs of canada.'),
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
            class: 'f6'
          }, 'Brian Mulroney'),
          div({
            class: 'f6'
          }, 'was prime-minister'),
        ]),
        div('w1 w-75 flex items-center center justify-center pl2', {
          style: {
            'min-width': '400px'
          }
        }, [
          div('mw4 f5 tr lh-copy mr2', 'communism was still basically a really harsh thing but I didn\'t understand it because I'),
          video('./src/born/img/stairsTwo.mp4', 'w4 w5-ns'),
          div('f1 ml2 mw4', 'was little')
        ])
      ])
    ])
  }

}
module.exports = Main

const div = require('../../lib/div')
const span = require('../../lib/span')
const img = require('../../lib/img')
const link = require('../../lib/link')

class Main {
  constructor() {
    this.el = div('w-100 tc flex justify-center items-center flex-wrap', 'min-height:30rem;', [
      div(' ', 'flex:1; min-width:10rem; max-width:15rem;', [
        div("Spencer Kelly"),
        div('pt2', "a software developer"),
      ]),
      div('h-100', 'flex:1; min-width:20rem; max-width:20rem;', [
        img('./src/01-hello/starter.png', 'br3 shadow-1')
      ]),
      div('flex flex-column justify-start  items-start ', 'flex:1; min-width:15rem; max-width:30rem;', [
        div('ml3', ['Projects:']),
        this.project('http://compromise.cool', './src/07-github/img/nlp-compromise.png', 'compromise'),
        this.project('https://github.com/spencermountain/wtf_wikipedia', './src/07-github/img/wtf-wikipedia.png', 'wtf-wikipedia'),
        this.project('https://github.com/spencermountain/spacetime', './src/07-github/img/spacetime.png', 'spacetime')

      ]),
      div('w-80 h3 bb b-blue outline', 'border-bottom:1px solid red;')
    ])

  }
  project(href, src, title) {
    return div('flex justify-center items-center tl blue mt3 tl ml3', [
      span('pa2', '  • '),
      link(href, img(src, 'w2 w1 pa1')),
      link(href, span('link dim ', title)),
    ])
  }
}
module.exports = Main

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
      div('h-100 relative', 'flex:1; min-width:20rem; max-width:30rem;', [
        img('./src/01-hello/starter.png', 'br3 shadow-1'),
        div('flex flex-column justify-start  items-start absolute', 'top:15%; left:45%; flex:1; width:50%;', [
          // div('ml3', ['work:']),
          this.project('http://compromise.cool', './src/07-github/img/nlp-compromise.png', 'nlp-compromise', 'nlp in javascript'),
          this.project('https://github.com/spencermountain/wtf_wikipedia', './src/07-github/img/wtf-wikipedia.png', 'wtf-wikipedia', 'wikipedia parsing'),
          this.project('https://github.com/spencermountain/spacetime', './src/07-github/img/spacetime.png', 'spacetime', 'timezone library')

        ]),
      ])
    ])

  }
  project(href, src, title, desc) {
    return div('flex justify-center items-center tl black mt4 tl ml3 link pointer', [
      // link(href, img(src, 'w2 w1 pa1')),
      link(href, [
        div('grow', 'font-weight:700; font-size:18px; color:#4e6b87; white-space: nowrap', [
          span('pa1', '  • '),
          title
        ]),
        div('ml1', 'color:grey; margin-left:3rem;', desc),
      ]),
    ])
  }
}
module.exports = Main

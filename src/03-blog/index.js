const div = require('../../lib/div')
const span = require('../../lib/span')
const flair = require('../lib/flair')
class Main {
  constructor() {
    this.el = div('tc items-center justify-around', 'flex:1; width:80%; min-height:30rem; max-width:60rem; background-color:#fafaff;', [
      div('relative pt4', 'left:10%; max-width:80%; width:80%;', [
        flair(["#cc8a66", "#66a8cc", "#66dc88", "#afcc66"], 1)
      ]),
      div('flex justify-center flex-wrap items-start tc mt4 pt5', [
        div('grey nowrap', 'font-size:1.5rem; color:#bacbe0;', 'What confuses me:'),
        div('pt4 w6 tl', 'position:relative;', [
          this.blog('Electricity in air', 0),
          this.blog('Internet bandwidth', -5),
          this.blog('Compound growth', 1),
          this.blog('Cooking oil', 2),
        ])
      ]),
      div('flex justify-start flex-wrap items-start tc pt4 ml5', [
        div('grey nowrap', 'font-size:1.5rem; color:#bacbe0;', 'I\'m reading about:'),
        div('pt4 w6 tl', 'position:relative;', [
          this.blog('Electricity in air', 0),
          this.blog('Internet bandwidth', -5)
        ])
      ])
    ])
  }
  blog(title, left) {
    return div('pa2 f4 w6 link pointer', `margin-left:${left}rem;`, [
      // span('pa1', '  • '),
      span('pa1 underline fw2 f5', title),
    ])
  }

}
module.exports = Main

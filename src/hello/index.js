const div = require('../../lib/div')
const img = require('../../lib/img')

class Main {
  constructor() {
    this.el = div('flex items-center center overflow-hidden', [
      div({
        class: 'pa4'
      }, [
        div("Spencer Kelly"),
        div('pt2', "not a confident software developer"),
      // div({
      //   class: 'w-100 tr'
      // }, "at all."),
      ]),
      img('./src/hello/starter.png', {
        class: 'mw-100 br3 shadow-1'
      })
    ])

  }

}
module.exports = Main

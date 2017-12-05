const pug = require('pug')
const div = require('../../lib/div')
const img = require('../../lib/img')
const style = require('../../lib/style')
let css = style`
container
	flex: 1
	display: flex
	flex-direction: column;
	font-size:20px;
	padding:100
`


class Main {
  constructor() {
    this.el = div({
      class: 'flex items-center center'
    }, [
      div({
        class: 'pa4'
      }, [
        div("Spencer Kelly"),
        div("not a confident software developer"),
        div({
          class: 'w-100 tr'
        }, "at all."),
      ]),
      img('./src/hello/starter.png', {
        class: 'mw-100 br3 shadow-1'
      })
    ])

  }

}
module.exports = Main

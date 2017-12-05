const div = require('../../lib/div')
const style = require('../../lib/style')
const img = require('../../lib/img')
let css = style`
container
	flex: 1
	display: flex
	font-size:20px;
	padding:100
box:
	padding:50
	text-align:center
`

class Main {
  constructor() {
    this.el = div(css.container, [
      // div(css.box, 'made collegehumor'),
      div('flex flex-column w5 tc', [
        div('2001'),
        img('./src/internet/img/linux.png', 'mw-100 w5 br3 shadow-1'),
        div('Installed linux')
      ]),
    ])
  }
}
module.exports = Main

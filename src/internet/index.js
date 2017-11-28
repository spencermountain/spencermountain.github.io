const div = require('../../lib/div')
const style = require('../../lib/style')
const img = require('../../lib/img')
let css = style`
container
	flex: 1
	display: flex
	border: 1px solid grey
	font-size:20px;
	padding:100
box:
	padding:50
	border:1px solid lightgrey
	text-align:center
`

class Main {
  constructor() {
    this.el = div(css.container, [
      // div(css.box, 'made collegehumor'),
      div(css.box, [
        div('1997'),
        img('./src/internet/img/linux.png', {
          width: 200
        }),
        div('Installed linux')
      ]),
    ])
  }
}
module.exports = Main

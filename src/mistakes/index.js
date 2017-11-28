const div = require('../../lib/div')
const img = require('../../lib/img')
const style = require('../../lib/style')
let css = style`
container
	flex: 1
	display: flex
	border: 1px solid grey
	font-size:20px;
	padding:100
box:
	padding:10
	text-align:center;
`

class Main {
  constructor() {
    this.el = div(css.container, [
      this.box('Did a philosophy degree', './src/mistakes/img/carpet.jpg'),
      this.box('Went to grad-school', './src/mistakes/img/table.png'),
      this.box('Died my own hair', './src/mistakes/img/blonde.jpg'),
    ])
  }
  box(str, src) {
    return div(css.box, [
      div(str),
      div('(that was a huge mistake)'),
      img(src, {
        width: 300
      }),
    ])
  }
}
module.exports = Main

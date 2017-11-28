const div = require('../../lib/div')
const img = require('../../lib/img')
const style = require('../../lib/style')
let css = style`
container
	flex: 1
	display: flex
	flex-direction: column;
	border: 1px solid grey
	font-size:20px;
	padding:100
`

class Main {
  constructor() {
    this.el = div(css.container, [
      div('I was born in the soft-rock suburbs of Canada'),

      img('./src/born/img/brian-mulroney.png', {
        width: 100
      }),
      div('Brian Mulroney was prime-minister'),
    ])
  }

}
module.exports = Main

const div = require('../../lib/div')
const style = require('../../lib/style')
const img = require('../../lib/img')
const glamor = require('glamor').css
const couples = require('./calculate')
let css = style`
container
	flex: 1
	display: flex
	flex-direction:column;
	padding:50
	position:relative;
	min-height:400px;
tree:
	flex: 1
	height:200
	position:relative;
	display:block
above:
	color:#c1bbbb;
	font-size:17
`
let couple = {
  position: 'absolute',
  'font-size': 9,
  color: 'grey',
  left: 0,
  top: 0,
  'text-align': 'left',
  'padding-left': 10
}

class Main {
  constructor() {
    let lines = couples.map((obj) => {
      let f = {
        opacity: obj.opacity,
        position: 'absolute',
        'border-bottom': '2px solid #f4bcc2',
        left: obj.girl.start + 'px',
        width: obj.girl.width + 'px',
        top: (obj.y + 10) + 'px'
      }
      let m = {
        opacity: obj.opacity,
        position: 'absolute',
        'border-bottom': '2px solid lightsteelblue',
        left: obj.guy.start + 'px',
        width: obj.guy.width + 'px',
        top: (obj.y + 13) + 'px'
      }
      let names = {
        position: 'absolute',
        fontSize: '11px',
        color: '#c1bbbb',
        left: obj.x + 'px',
        top: obj.y + 'px'
      }
      return div({
        style: couple
      }, [
        div({
          style: f
        }),
        div({
          style: m
        }),
        div({
          style: names
        }, `${obj.names[1]}+${obj.names[0]}`),
      ])
    })
    this.el = div(css.container, [
      div('but before that, there were many farmers and doctors-'),
      div('their lives were probably hard.'),
      div('or maybe they weren\'t. I don\'t know.'),
      div(css.tree, lines),
    ])
  }
}
module.exports = Main

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
	margin-bottom:50
	position:relative;
	min-height:400px;
above:
	color:#c1bbbb;
	font-size:17
axis:
	display:flex
	flex:1
	justify-content: space-around;
	color:lightgrey
	border-bottom:1px solid lightgrey
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
        left: (obj.x + 50) + 'px',
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
      div('f1 mid-gray', 'before that though,'),
      div('gray', 'there were these farmers in even smaller towns.'),
      div('gray', 'their lives were probably hard.'),
      div('mt3', ' or maybe they weren\'t.'),
      div(' I don\'t know.'),
      div('relative block ml6-ns ml4-m', {
        style: {
          height: '300px',
          top: '-50px'
        }
      }, lines),
    // div(css.axis, [
    //   div('2017'),
    //   div('1950'),
    //   div('1901'),
    // ]),
    ])
  }
}
module.exports = Main

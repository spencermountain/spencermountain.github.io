const div = require('../../lib/div')
const img = require('../../lib/img')
const el = require('redom').el;
const Macy = require('macy')
const unicode = require('./unicode')
const style = require('../../lib/style')
let css = style`
container
	display: flex
	flex: 1
	flex-direction: column;
	font-size:20px;
thing:
	display:flex
	flex:1
	flex-direction: column;
	text-align: center;
	padding:50
underline:
	flex:1
	text-align: left;
	font-style: italic;
	padding-left:5
	margin-bottom:10
	border-bottom:2px solid steelblue
streams:
	font-family: Times, Times New Roman, Georgia, serif;
	color:lightsteelblue;
	font-size:30px;
bio:
	text-align:center;
`

class Main {
  constructor() {
    this.el = div(css.container, [
      this.thing('I really like rural Ontario', this.niceOntario()),
      this.thing('I like clumsy web technology', this.streams()),
      this.thing('I hate the gap between biology and computers', this.bio()),
    ])
  }
  streams() {
    return div(css.streams, [
      div(unicode()),
      div(unicode()),
      div(unicode()),
    ])
  }
  bio() {
    return div(css.bio, [
      img('./src/today/img/cell.png', 'h6')
    ])
  }
  niceOntario() {
    return div('flex', [
      img('./src/today/ontario/huron2.png', 'h5'),
      img('./src/today/ontario/farms.png', 'h5'),
      img('./src/today/ontario/toronto2.png', 'h5'),
    ])
  }
  thing(str, inside) {
    return div(css.thing, [
      div(css.underline, str),
      inside
    ])
  }
}
module.exports = Main

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
	border: 1px solid grey
	flex-direction: column;
	font-size:20px;
	padding:100
thing:
	display:flex
	flex:1
	flex-direction: column;
	text-align: center;
	padding:50
	border: 1px solid grey
underline:
	flex:1
	text-align: left;
	font-style: italic;
	padding-left:5
	margin-bottom:10
	border-bottom:2px solid steelblue
macy:
	max-height: 390px;
	overflow: hidden;
streams:
	font-family: Times, Times New Roman, Georgia, serif;
	color:lightsteelblue;
bio:
	text-align:center;
`

class Main {
  constructor() {
    this.el = div(css.container, [
      this.thing('I really love rural Ontario', this.niceOntario()),
      this.thing('I really love the clumsy web technologies', this.streams()),
      this.thing('I really hate the gap between biology and computers', this.bio()),
    ])
  }
  onmount() {
    console.log('mounted')
    Macy({
      container: '#macy-container',
      trueOrder: true,
      waitForImages: false,
      margin: 0,
      columns: 4
    });
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
      img('./src/today/img/cell.png', {
        width: 300,
        'align-self': 'center'
      })
    ])
  }
  niceOntario() {
    return div(css.macy, el('#macy-container', [
      img('./src/today/ontario/huron2.png', {
        width: 300
      }),
      img('./src/today/ontario/farms.png', {
        width: 300
      }),
      img('./src/today/ontario/green-belt.png', {
        width: 300
      }),
      img('./src/today/ontario/water.png', {
        width: 300
      }),
      img('./src/today/ontario/st-catherines.png', {
        width: 300
      }),
      img('./src/today/ontario/port-credit.png', {
        width: 300
      }),
      img('./src/today/ontario/toronto2.png', {
        width: 300
      }),
      img('./src/today/ontario/wiarton.png', {
        width: 300
      }),
    ])
    )
  }
  thing(str, inside) {
    return div(css.thing, [
      div(css.underline, str),
      inside
    ])
  }
}
module.exports = Main

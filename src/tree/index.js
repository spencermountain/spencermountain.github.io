const div = require('../../lib/div')
const style = require('../../lib/style')
const setStyle = require('redom').setStyle
const img = require('../../lib/img')
const glamor = require('glamor').css
const calculate = require('./calculate')
const makeAxis = require('./axis')

let css = style`
container
	flex: 1
	display: flex
	flex-direction:column;
	padding:50
	margin-bottom:50
	position:relative;
	min-height:400px;
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
    var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    let data = calculate(width)
    this.lines = this.drawLines(data)
    // this.axis = this.drawAxis(width)
    this.el = div(css.container, [
      div('f1 mid-gray', 'before that though,'),
      div('gray', 'there were these farmers in smaller towns.'),
      div('gray', 'their lives were probably hard.'),
      div('mt3', ' or maybe they weren\'t.'),
      div(' I don\'t know.'),
      div('relative block ml6-ns ml4-m', {
        style: {
          height: '370px',
          top: '0px'
        }
      }, [
        this.lines,
        this.axis
      ]),
    // div(css.axis, [
    //   div('2017'),
    //   div('1950'),
    //   div('1901'),
    // ]),
    ])
  }
  drawLabel(val, label) {
    return div({
      style: {
        position: 'absolute',
        color: 'lightgrey',
        width: '30px',
        bottom: '15px',
        'font-size': '10px',
        'text-align': 'left',
        '-webkit-transform': 'rotate(-70deg)',
        '-moz-transform': 'rotate(-70deg)',
        left: val + 'px',
      }
    }, label)
  }
  drawAxis(width) {
    let obj = makeAxis(width)
    return div('relative w-100 h-100', [
      div({
        style: {
          position: 'absolute',
          width: '100%',
          height: '25px',
          bottom: '0px',
          'border-bottom': '1px dashed lightgrey'
        }
      }, Object.keys(obj).map(k => {
        return this.drawLabel(obj[k], k)
      })
      )
    ])
  }
  drawLines(couples) {
    let lines = couples.map((obj) => {
      let f = {
        opacity: obj.opacity,
        position: 'absolute',
        'border-bottom': '2px solid #f4bcc2',
        left: obj.girl.start + 'px',
        width: obj.girl.width + 'px',
        top: (obj.y + 16) + 'px'
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
    return lines
  }
  updateEl(el, obj) {
    setStyle(el.children[0], {
      left: obj.girl.start + 'px',
      width: obj.girl.width + 'px',
    })
    setStyle(el.children[1], {
      left: obj.guy.start + 'px',
      width: obj.guy.width + 'px',
    })
    setStyle(el.children[2], {
      left: obj.x + 'px',
    })
  }
  redraw() {
    let width = this.el.getBoundingClientRect().width
    let data = calculate(width)
    this.lines.forEach((el, i) => {
      this.updateEl(el, data[i])
    })
  // let axis = makeAxis(width)
  // let labels = this.axis.children[0].children || []
  // Object.keys(axis).forEach((k, i) => {
  //   setStyle(labels[i], {
  //     left: axis[k] + 'px'
  //   })
  // })
  }
  onmount() {
    this.timeout;
    //debounce on-resize event
    window.addEventListener('resize', () => {
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      this.timeout = setTimeout(() => {
        this.redraw()
      }, 500)
    })
  }
}
module.exports = Main

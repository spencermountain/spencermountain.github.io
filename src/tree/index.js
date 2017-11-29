const div = require('../../lib/div')
const style = require('../../lib/style')
const img = require('../../lib/img')
const glamor = require('glamor').css
const couples = require('./calculate')
let css = style`
container
	flex: 1
	display: flex
	font-size:20px;
	padding:100
	position:relative;
	min-height:400px;
`

{
  /* <template>
    <div id="tree">
  		<div v-for="obj in couples">
  			<div class="line female" v-bind:style="{ opacity:obj.opacity, left: obj.girl.start+'px', width:obj.girl.width+'px',top: (obj.y+10)+'px'}"/>
  			<div class="line male" v-bind:style="{ opacity:obj.opacity, left: obj.guy.start+'px', width:obj.guy.width+'px',top: (obj.y+13)+'px'}"/>
  			<!-- <div class="person" v-bind:class="{ female: p.sex==='f' }" v-bind:style="{ left: p.x+'px', top: p.y+'px', 'min-width':p.width+'px'}"> -->
  			<div class="couple" v-bind:style="{ left: obj.x+'px', top: obj.y+'px'}">
  				{{ `${obj.names[1]}+${obj.names[0]}` }}
  			</div>
  		</div>
    </div>
  </template> */
}
console.log(couples)
class Main {
  constructor() {
    let couple = {
      position: 'absolute',
      'font-size': 9,
      color: 'grey',
      left: 0,
      top: 0,
      'text-align': 'left',
      'padding-left': 10
    }
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
      // f = Object.assign(f, couple)
      // m = Object.assign(m, couple)
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
    this.el = div(css.container, lines)
  }
}
module.exports = Main

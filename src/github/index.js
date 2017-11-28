const div = require('../../lib/div')
const img = require('../../lib/img')
const style = require('../../lib/style')
let css = style`
container
	flex: 1
	display: flex
	flex-direction: column;
	border: 1px solid grey
	justify-content: center;
	font-size:20px;
	padding:100
	text-align:center;
title:
	flex:1
	font-size:17px;
	margin:20
	display: flex
	flex-direction: row
	text-align:center;
	justify-content: center;
	max-width:400
projects:
	display: flex
	flex-direction: row
	justify-content: space-between;
	align-items: flex-end;
	flex:1
	height:120
img:
	width:80
orgs:
	display: flex
	flex-direction: row
	justify-content: center;
org:
	color:steelblue
num:
	font-size:30px
	color:#3aa83c;
`

class Main {
  constructor() {
    this.el = div(css.container, [
      div(css.title, [
        div('I built and maintain'),
        div(css.num, '3'),
        div('very-challenging open source projects:'),
      ]),
      div(css.projects, [
        this.project('nlp-compromise', './src/github/img/nlp-compromise.png'),
        this.project('wtf_wikipedia', './src/github/img/wtf-wikipedia.png'),
        this.project('spacetime', './src/github/img/spacetime.png'),
      ]),
      div('hilariously, they\'re running at thousands of organizations'),
      div(css.orgs, [
        div('including: '),
        div(css.org, 'Microsoft, CitiBank, the Guardian, and the UN'),
        div('[1]'),
      ])
    ])
  }
  project(title, src, desc) {
    return div({}, [
      img(src, css.img),
      div(css.title, title),
      div(css.desc, desc),
    ])
  }
}
module.exports = Main

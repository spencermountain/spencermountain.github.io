const div = require('../../lib/div')
const span = require('../../lib/span')
const el = require('redom').el;
const img = require('../../lib/img')
const link = require('../../lib/link')
const style = require('../../lib/style')
let css = style`
container
	flex: 1
	display: flex
	flex-direction: column;
	justify-content: center;
	font-size:20px;
	margin-top:20
	text-align:center;
title:
	flex:1
	font-size:21px;
	margin:20
	display: flex
	flex-direction: row
	text-align:center;
	justify-content: center;
	max-width:400
projects:
	display: flex
	flex-direction: row
	text-align:left
	justify-content: space-between;
	align-items: flex-end;
	flex:1
	height:120
	max-width:80%
orgs:
	display: flex
	flex-direction: row
	justify-content: center;
friends:
	margin-top: 30px
	text-align: center
	margin-left: 20px
	font-size:17
friendList:
	margin-top: 10px
	font-size:17px;
	min-height:80px
	width:80%;
	max-width:500px;
	align-self:center;
	display: flex
	flex-direction: row
	justify-content: space-around;
friend:
	color:steelblue
	margin:10
org:
	color:steelblue
	margin:5px;
num:
	font-size:50px
	padding-left:15px;
	padding-right:15px;
	color:#3aa83c;
desc
	border-top:1px solid lightgrey
`

class Main {
  constructor() {
    this.el = div('mt6 ma3 lh-hero', [
      div('f2 blue', 'But now,'),
      div(css.container, [
        div(css.title, [
          div('f3', 'I built and maintain'),
          div(css.num, '3'),
          div('f3', 'very-challenging open-source projects:'),
        ]),
        div('flex justify-around flex-wrap mw-80 items-end', [
          this.project('nlp-compromise', './src/github/img/nlp-compromise.png', 'http://compromise.cool'),
          this.project('wtf_wikipedia', './src/github/img/wtf-wikipedia.png', 'https://spencermountain.github.io/wtf_wikipedia/'),
          this.project('spacetime', './src/github/img/spacetime.png', 'https://smallwins.github.io/spacetime/'),
        ]),
        div('mt4 mb2 f5', 'hilariously, they\'re running at thousands of organizations.'),
        div('f4', [
          span('f5 mr2', 'including: '),
          span(css.org, [
            'Microsoft, CitiBank, the Guardian,',
            span('gray ph1', 'and the'),
            'United Nations',
            el('a', {
              href: 'https://www.microsoft.com/reallifecode/2017/06/06/geocoding-social-conversations-nlp-javascript/',
              class: 'link dim f5'
            }, [el('sup', ' [1]')]),
          ]),
        ]),
        div('f5 mt3', [
          span('dim-gray', 'I\'ve worked for:'),
          div('flex justify-center flex-wrap f6', [
            link('http://state.com', 'link dim pa1 light-green', 'State.com,'),
            link('http://govinvest.com', 'link dim pa1 orange', 'Govinvest,'),
            link('http://topix.io', 'link dim pa1 light-blue', 'Topix.io,'),
            link('http://kmstandards.com', 'link dim pa1 pink', 'KMStandards,'),
            // span('pa1 light-red', 'and'),
            link('http://begin.com', 'link dim pa1 light-red', 'and SmallWins.'),
          ])
        ]),
        div('dim-gray f5 mt4', 'I\'ve gotten to learn from people like:'),
        div(css.friendList, [
          el('a', {
            href: 'http://philgribbon.com/',
            class: 'link dim blue f4'
          }, 'Phil Gribbon'),
          el('a', {
            href: 'https://zooid.org/~vid/',
            class: 'link dim blue f4'
          }, 'David Mason'),
          el('a', {
            href: 'https://github.com/brianleroux',
            class: 'link dim blue f4'
          }, 'Brian LeRoux'),
        ]),
      ])
    ])
  }
  project(title, src, href) {
    return el('a', {
      class: 'link dim bb bw2 blue mt3',
      href: href
    }, [
      img(src, 'w-100 mw3'),
      div(css.title, title),
    // div(css.desc, desc),
    ])
  }
}
module.exports = Main

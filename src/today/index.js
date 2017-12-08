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
    this.el = div('center relative', [
      div('relative flex items-center mt4', [
        div('f1 f-title-m f-headline-ns absolute w-100 center washed-green pa3-ns top-0', 'I really'),
        div('f1 f-title-m f-headline-ns absolute w-100 center washed-green pa3-ns bottom-4 ', 'like rural'),
        div('f1 f-title-m f-headline-ns absolute w-100 center washed-green pa3-ns bottom-0 ', 'Ontario'),
        img('./src/today/img/ontario.png', 'mw-100'),
      ]),
      div('', 'for some reason'),
      div('relative flex items-center justify-center mt4', [
        div('f1 f-title-m f-headline-ns absolute w-100 center near-white pa3 top-0', 'I don\'t'),
        div('f1 f-title-m f-headline-ns absolute w-100 center light-blue pa3 bottom-4 ', 'understand'),
        div('f1 f-title-m f-headline-ns absolute w-100 center near-white pa3 bottom-0 ', 'biology'),
        img('./src/today/img/cell2.png', 'mw-100'),
      ]),
      div('absolute pr3 right-0', 'but wish I did'),
    ])
  }
}
module.exports = Main

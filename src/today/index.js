const div = require('../../lib/div')
const img = require('../../lib/img')
const svg = require('redom').svg;
const link = require('../../lib/link')
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
      div('ml3', 'for some reason'),

      div('relative flex items-center justify-center mt4', [
        div('f1 f-title-m f-headline-ns absolute w-100 center near-white pa3 top-0', 'I don\'t'),
        div('f1 f-title-m f-headline-ns absolute w-100 center light-blue pa3 bottom-4 ', 'understand'),
        div('f1 f-title-m f-headline-ns absolute w-100 center near-white pa3 bottom-0 ', 'biology'),
        img('./src/today/img/cell2.png', 'mw-100'),
      ]),
      div('absolute mr3 right-0', 'but I sure wish I did'),

      div('relative items-center justify-center mt6 mh2 pl4 bb b--blue bw3', {
        style: {
          'max-width': '500px',
          'width': '75%',
        }
      }, [
        div('relative f2 f1-m f1-ns w-100 center dim-gray shrink', 'because'),
        div('relative ml3 f1 f-subheadline-m f-headline-ns w-100 center light-gray shrink', 'Software'),
        div('relative f1 f-headline-m f-headline-ns w-100 center light-blue shrink', 'is not'),
        div('relative ml3 f2 f1-m f1-ns w-100 center dim-gray shrink', 'clever enough'),
        div('relative f2 f2-m f1-ns w-100 center light-blue mb2', 'yet.'),
        svg('svg', {
          style: {
            position: 'absolute',
            right: '-80px',
            bottom: '-50px',
            width: '80px',
            height: '50px',
            overflow: 'visible'
          }
        }, [
          svg('path', {
            d: "M-5 4 C 30 5, 40 10, 80 40",
            stroke: "#357edd",
            'stroke-linecap': "round",
            'stroke-width': ".5rem",
            fill: "none"
          })
        ])
      ]),
      div('pb6 pt2 mh2 pl4 tl', [
        link('mailto:spencermountain@gmail.com', 'f3 link dim underline lh-title mh2 light-blue', 'I\'m available for work'),
        div('ml4', 'I only do one job at a time')
      ]),
    ])
  }
}
module.exports = Main

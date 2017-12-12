const svg = require('redom').svg
const div = require('../../lib/div')
const img = require('../../lib/img')
const link = require('../../lib/link')
const Plant = require('../plant')

class Main {
  constructor() {
    this.el = div('tc', [
      div('flex justify-around h4 mw7 ', [
        link('https://twitter.com/spencermountain', 'link grey dim flex flex-column tc', [
          img('./src/end/icons/twitter.svg', 'w3'),
          div('light-blue fw1 ', 'twitter')
        ]),
        link('https://www.goodreads.com/user/show/51017977-spencer', 'link grey dim flex flex-column tc', [
          img('./src/end/icons/goodreads.svg', 'w3'),
          div('fw2 ', {
            style: {
              color: '#7D5024'
            }
          }, 'goodreads')
        ]),
      ]),
      div('m3 tl', {
        style: {
          position: 'relative',
          bottom: '-55px',
          'z-index': '-1',
        }
      }, [
        new Plant(),
      ]),
      div('w-100 block tl pb3', {
        style: {
          'padding-left': '100px'
        }
      }, [
        link('mailto:spencermountain@gmail.com', 'link dim  b avenir bb bw1 b--dim-gray f6 f3-ns ph2 fw2 light-green', 'spencermountain@gmail.com'),
        svg('svg', {
          viewBox: "0 0 300 300",
          style: {
            position: 'relative',
            height: '30px',
            width: '30px',
            left: '-5px',
            top: '10px'
          }
        }, [
          //stem
          svg('path', {
            d: "M 110 44 L 110 44 L 107.546875 30.546875 L 95.73828125 22.623046875 L 76.7275390625 20 L 47.38671875 22.548828125 L 34.90234375 29.09765625 L 24 43.376953125 L 20.794921875 60.703125 L 23.279296875 77.494140625 L 30.3056640625 92.42578125 L 45.4921875 109.4921875 L 67.626953125 124.98828125 L 134.548828125 159.73046875 L 136 156 L 108 47 L 117.875 41.3203125 L 179.75390625 20.376953125 L 193.525390625 25.07421875 L 197.376953125 30.44140625 L 197.923828125 49.2177734375 L 186.8798828125 71.240234375 L 170.5078125 97.3828125 L 162.3359375 112.2109375 L 153.3359375 125.4375 L 134.828125 150.171875 L 132 153",
            stroke: "#ff35fa",
            'stroke-linecap': "round",
            'stroke-width': ".5rem",
            fill: "#ff35fa"
          }),
        ])
      ]),
      div('w-100 bg-light-blue h2', {
        style: {
          'background-color': '#408BC9'
        }
      }, []),
    ])

  }

}
module.exports = Main

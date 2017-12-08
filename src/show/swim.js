const pug = require('pug')
const div = require('../../lib/div')
const el = require('redom').el;
const video = require('../../lib/video')

const wave = function() {
  let d = "M 75 32 L 75 32 L 59.1279296875 36.623046875 L 44.0986328125 42.9892578125 L 38 51"
  return el('path', {
    'xml:space': "preserve",
    d: d,
    stroke: "#1b76ff",
    'stroke-width': "24px",
    fill: "none",
    'stroke-linecap': "round",
    'stroke-linejoin': "round"
  })

}

class Main {
  constructor() {
    this.el = div('flex outline items-center justify-center pv5', [
      div('relative', [
        video('./src/show/things/swimfast.mp4', {
          class: 'w5 br3 shadow-1 relative '
        }),
        div('h1 w5 absolute bg-blue bottom-0 o-80', {
          style: {
            'border-bottom-left-radius': '.5rem',
            'border-bottom-right-radius': '.5rem',
          }
        }, []),
      ]),
      div('w5 ml3', [
        div('underline pb2 f4', 'the web is a silly place.'),
        el('svg', {
          'xml:space': "preserve",
          width: '100px',
          height: '100px'
        }, [
          el('path', {
            stroke: '#1b76ff',
            d: 'M 32 54 L 77.0126953125'
          })
        ]),
        div('center', 'our tools and software'),
        div('center', 'are certainly quite ridiculous')
      ])
    ])

  }

}
module.exports = Main

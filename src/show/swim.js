const pug = require('pug')
const div = require('../../lib/div')
const img = require('../../lib/img')
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
    this.el = div('pt5', [
      div('f2 blue ml3 mb3', 'But you know,'),
      div('flex items-center justify-center pt2 pb5 flex-wrap', [
        div('relative', [
          video('./src/show/things/swim.mp4', {
            class: 'w5 br3 shadow-1 relative '
          }),
          div('h1 w5 absolute bg-blue bottom-0 o-80', {
            style: {
              'border-bottom-left-radius': '.5rem',
              'border-bottom-right-radius': '.5rem',
            }
          }, []),
        ]),
        div('w5 ma3', [
          div('underline pb2 f4', 'the web is a silly place.'),
          img('./src/show/wave2.svg', 'w4'),
          // el('svg', {
          //   'xml:space': "preserve",
          //   width: '100px',
          //   height: '100px'
          // }, [
          //   el('path', {
          //     stroke: '#1b76ff',
          //     d: 'M 32 54 L 77.0126953125'
          //   })
          // ]),
          // div('center', 'the technologies'),
          // div('center', 'are certainly quite ridiculous'),
          div('blue ml2', [
            "⸟",
            "׆",
            "∗",
            "יִ",
            "ײַ",
            "؞",
            "‎",
            "؛",
            "؀",
            "∘",
            "⌌",
            "∙",
            "∻",
            "⌍",
            "⋄",
            "⋅",
            "٭",
            "⋆",
            "ﻩ",
            "‎",
            "∼",
            "ͻ",
            "∽",
            "ر",
            "‎",
            "⸰",
            "·",
            "∾",
            "∿",
            "⋰",
            "፣",
            "҃",
            "῁῀ﺓ‎᾽῍῎`‘",
            "∼ͻ∽ر‎⸰·∾∿⋰",
          ])
        ])
      ])
    ])

  }

}
module.exports = Main

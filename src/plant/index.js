const svg = require('redom').svg
const div = require('../../lib/div')
const img = require('../../lib/img')
const link = require('../../lib/link')

const leaf = () => {
  return svg('path', {
    d: "M 25 53 L 39.34375 28.65625 L 46.6875 23.828125 L 69.34375 20.171875 L 77 22 L 27 53 L 44.0703125 51.1171875 L 55.4462890625 46.7490234375 L 69.3564453125 36.5791015625 L 77 29",
    stroke: "#00850a",
    'stroke-linecap': "round",
    'stroke-width': ".5rem",
    transform: "scale(0.5) translate(120,50)",
    fill: "#00850a"
  })
}
const leaf2 = () => {
  return svg('path', {
    d: "M 25 53 L 39.34375 28.65625 L 46.6875 23.828125 L 69.34375 20.171875 L 77 22 L 27 53 L 44.0703125 51.1171875 L 55.4462890625 46.7490234375 L 69.3564453125 36.5791015625 L 77 29",
    stroke: "#00850a",
    'stroke-linecap': "round",
    'stroke-width': ".5rem",
    transform: "scale(0.7) translate(40,50) rotate(20)",
    fill: "#00850a"
  })
}
const leaf3 = () => {
  return svg('path', {
    d: "M 180 30.5 L 138.140625 34.671875 L 114.625 43.1875 L 76.5625 66.8828125 L 27 115.671875 L 22.828125 121.5 L 79.2734375 117.390625 L 159.6875 80.984375 L 196 48.5009765625 L 200.171875 42.328125 L 198.623046875 38.123046875 L 191.171875 36.5 L 188 35.5",
    stroke: "#158f00",
    'stroke-linecap': "round",
    'stroke-width': ".5rem",
    transform: "scale(0.3) translate(40,50) rotate(20)",
    fill: "#158f00"
  })
}
const leaf4 = () => {
  return svg('path', {
    d: "M 180 30.5 L 138.140625 34.671875 L 114.625 43.1875 L 76.5625 66.8828125 L 27 115.671875 L 22.828125 121.5 L 79.2734375 117.390625 L 159.6875 80.984375 L 196 48.5009765625 L 200.171875 42.328125 L 198.623046875 38.123046875 L 191.171875 36.5 L 188 35.5",
    stroke: "#158f00",
    'stroke-linecap': "round",
    'stroke-width': ".5rem",
    transform: "scale(0.3) translate(115,-30) rotate(0)",
    fill: "green"
  })
}

class Main {
  constructor() {
    this.el = svg('svg', {
      viewBox: "0 0 100 300",
      style: {
        height: '8rem',
        width: '6rem'
      }
    }, [
      //stem
      svg('path', {
        d: "M 102 462 L 110.59375 421.28515625 L 115.712890625 336.7724609375 L 115.7451171875 248.1728515625 L 109.921875 180.48828125 L 97.673828125 128.2431640625 L 74.98046875 64.0234375 L 57.705078125 35.923828125 L 37.869140625 22.623046875 L 20.623046875 20 L 20 20",
        stroke: "#19a974",
        'stroke-linecap': "round",
        'stroke-width': ".5rem",
        fill: "none"
      }),
      leaf(),
      leaf2(),
      leaf3(),
      leaf4(),
    ])
  }
}
module.exports = Main

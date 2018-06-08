const scaleLinear = require('d3-scale').scaleLinear
//
const makeAxis = function(width) {
  let now = new Date().getFullYear()
  let xScale = scaleLinear().range([0, width]).domain([now, 1800])
  return {
    spencer: xScale(1986),
    ww2: xScale(1945),
    ww1: xScale(1914),
    // 'war1812': xScale(1812),
    canada: xScale(1867),
  }
}
module.exports = makeAxis

const scaleLinear = require('d3-scale').scaleLinear
const treeData = require('./tree-data')
let height = 200
let GENERATIONS = 4

const calculate = function(width) {
  if (width < 300) {
    width = 300
  }
  let now = new Date().getFullYear()
  let xScale = scaleLinear().range([0, width]).domain([now, 1800])
  let yScale = scaleLinear().range([0, height]).domain([-5, 5])

  let couples = []
  // const widths=[0,81,45,18]//4gens
  const widths = [0, 90, 45, 20] //5gens
  const doCouple = function(girl, guy, gen, y) {
    let start = girl.death || guy.death
    if (guy.death < girl.death) {
      start = guy.death
    }
    let arrow = {}
    if (gen < 5 && girl.mom.name) {
      arrow = {
        mom: xScale(girl.mom.birth),
        dad: xScale(girl.dad.birth),
      }

    }
    let opacity = 1
    // if (gen > GENERATIONS) {
    //   opacity = 0.5
    // }
    couples.push({
      names: [girl.name.split(' ')[0], guy.name.split(' ')[0]],
      x: xScale(start - 5),
      y: y,
      guy: {
        start: xScale(guy.death),
        width: xScale(guy.birth) - xScale(guy.death)
      },
      girl: {
        start: xScale(girl.death),
        width: xScale(girl.birth) - xScale(girl.death)
      },
      opacity: opacity,
      arrow: arrow
    })
    if (gen < GENERATIONS && girl.mom.name) {
      let half = widths[gen] //parseInt((height/gen)/2)
      doCouple(girl.mom, girl.dad, gen + 1, y + half)
      doCouple(guy.mom, guy.dad, gen + 1, y - half)
    }
  }
  doCouple(treeData.mom, treeData.dad, 1, 150)
  return couples
}

module.exports = calculate

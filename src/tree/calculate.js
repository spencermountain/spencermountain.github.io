const scaleLinear = require('d3-scale').scaleLinear
const treeData = require('./tree-data')
let height = 200
let xScale = scaleLinear().range([0, 700]).domain([1985, 1790])
let yScale = scaleLinear().range([0, height]).domain([-5, 5])

let couples = []
// const widths=[0,81,45,18]//4gens
const widths = [0, 90, 45, 20] //5gens
const doCouple = function(girl, guy, gen, y) {
  let start = girl.birth || guy.birth
  if (guy.birth < girl.birth) {
    start = guy.birth
  }
  let arrow = {}
  if (gen < 5 && girl.mom.name) {
    arrow = {
      mom: xScale(girl.mom.birth),
      dad: xScale(girl.dad.birth),
    }

  }
  if (!guy.death) {
    console.log(guy.name)
  }
  if (!girl.death) {
    console.log(girl.name)
  }
  let opacity = 1
  if (gen > 4) {
    opacity = 0.5
  }
  couples.push({
    names: [girl.name.split(' ')[0], guy.name.split(' ')[0]],
    x: xScale(start),
    y: y,
    guy: {
      start: xScale(guy.birth),
      width: xScale(guy.birth) - xScale(guy.death)
    },
    girl: {
      start: xScale(girl.birth),
      width: xScale(girl.birth) - xScale(girl.death)
    },
    opacity: opacity,
    arrow: arrow
  })
  if (gen < 4 && girl.mom.name) {
    let half = widths[gen] //parseInt((height/gen)/2)
    doCouple(girl.mom, girl.dad, gen + 1, y + half)
    doCouple(guy.mom, guy.dad, gen + 1, y - half)
  }
}
doCouple(treeData.mom, treeData.dad, 1, 150)
module.exports = couples

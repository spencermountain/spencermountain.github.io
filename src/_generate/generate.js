const { weighted, choose } = require('./_fns')

let images = [
  'boats.jpg',
  'cement-house.jpg',
  'church.jpg',
  'cow-street.jpg',
  'delta.jpg',
  'dinner-1.jpg',
  'dog-rose.jpg',
  'dunno.jpg',
  'europa.jpg',
  'flood.jpg',
  'grandfather.jpg',
  'hair-background.jpg',
  'hay.jpg',
  'house.jpg',
  'japan-subway.jpg',
  'know.jpg',
  'mushrooms.jpg',
  'orange.jpg',
  'saddam.jpg',
  'satellite.jpg',
  'sawdust.jpg',
  'sea.jpg',
  'solar-panel.jpeg',
  'vancouver.jpg',
  'venus.jpg',
  'victoria-cow.jpg',
  'vintage-photo.jpg',
  'yeast.jpg'
].map(str => './assets/misc/' + str)

const generate = function() {
  let cells = []
  for (let i = 0; i < 10; i++) {
    cells.push({
      classes: [],
      image: null
    })
  }
  //add one wide one (not on the end)
  let wide = choose([0, 1, 2, 3, 5, 6, 7, 8])
  cells[wide].classes.push('row2')
  //add one tall one (from the top)
  let tall = choose([0, 1, 2, 3, 4])
  cells[tall].classes.push('col2')

  cells.forEach(cell => {
    //choose colors
    let bgColor = weighted({
      '': 120,
      bgred: 15,
      bgsky: 15,
      bgpink: 15,
      bgblue: 15,
      bggrey: 15,
      bgbrown: 15,
      bgrose: 15
    })
    cell.classes.push(bgColor)

    //add images
    let hasImg = weighted({
      yes: 20,
      no: 80
    })
    if (hasImg === 'yes') {
      cell.image = choose(images)
    }
  })

  return cells.slice(0, 8)
}
module.exports = generate

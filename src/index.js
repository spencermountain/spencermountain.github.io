const htm = require('htm')
const h = htm.bind(require('vhtml'))
// const generate = require('./generate')
const interesting = require('../interesting')
const shrinkGrid = require('./shrink-grid')

// let cells = generate()
// console.log(JSON.stringify(cells))

const drawGrid = function(cells) {
  cells = cells.map(cell => {
    let classes = cell.classes.join(' ')
    let style = ''
    if (cell.image) {
      style += `background-image:url(${cell.image});`
    }
    return h`<div class=${classes} style=${style}>${cell.text}</div>`
  })
  return cells
}

document.querySelector('#topGrid').innerHTML = shrinkGrid()

let grid = document.querySelector('#showAll')

let html = interesting
  .map((cells, i) => {
    return h`<div class="goldGrid mv6">
 ${drawGrid(cells)}
</div>
`
  })
  .join(' ')

grid.innerHTML = html

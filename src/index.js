const htm = require('htm')
const h = htm.bind(require('vhtml'))
// const generate = require('./generate')
const interesting = require('../interesting')

// let cells = generate()
// console.log(JSON.stringify(cells))

const drawGrid = function(cells) {
  cells = cells.map(cell => {
    let classes = cell.classes.join(' ')
    let style = ''
    if (cell.image) {
      style += `background-image:url(${cell.image});`
    }
    return h`<div class=${classes} style=${style}></div>`
  })
  return cells
}

let grid = document.querySelector('#showAll')

let html = interesting
  .map((cells, i) => {
    return h`<div>${i}<div class="goldGrid h8 mv4">
 ${drawGrid(cells)}
</div></div>
`
  })
  .join(' ')
console.log(html)
grid.innerHTML = html

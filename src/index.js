const htm = require('htm')
const h = htm.bind(require('vhtml'))
const { weighted, choose } = require('./_fns')

let grid = document.querySelector('#grid')

const colNum = 10

let images = [
  'boats.jpg',
  'delta.jpg',
  'flood.jpg',
  'house.jpg',
  'orange.jpg',
  'satellite.jpg',
  'sea.jpg',
  'vancouver.jpg',
  'yeast.jpg'
].map(str => './assets/misc/' + str)

let rows = new Array(colNum).fill('').map(_ => [''])

//choose colors
rows.forEach(arr => {
  let choice = weighted({
    '': 120,
    bgred: 15,
    bgsky: 15,
    bgpink: 15,
    bgblue: 15,
    bggrey: 15,
    bgbrown: 15,
    bgrose: 15
  })
  if (choice) {
    arr.push(choice)
  }
})

//choose sizes
let wide = parseInt(Math.random() * 3, 10) * 4
if (Math.random() > 0.5) {
  wide += 1
}
rows[wide].push('row2')
let tall = parseInt(Math.random() * 8, 10)
rows[tall].push('col2')

choose(rows).push('hasImg')
choose(rows).push('hasImg')
choose(rows).push('hasImg')
choose(rows).push('rounded')
rows = rows.map(arr => h`<div class=${arr.join(' ')}></div>`)

let style = `
display:grid;
grid-template-columns: 0.618fr 1fr 0.618fr 1fr ;
grid-template-rows: 1fr 0.618fr 1fr;
`

grid.innerHTML = h`
<div class="h8 grow maxw10 rounded clip" style="${style}">
   ${rows}
</div>
 `
let els = document.querySelectorAll('.hasImg')
for (let i = 0; i < els.length; i++) {
  let img = choose(images)
  els[i].style.backgroundImage = `url("${img}")`
  // el.innerHTML = h`<img src=${img} class="clip"/>`
}

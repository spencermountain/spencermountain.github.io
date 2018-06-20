const div = require('../../lib/div')

const flair = (colors, height) => {
  height = height || 1.2
  return div('flex justify-around items-center tc mt3', `width:100%; height:${height}rem; overflow:hidden; border-radius:5px;`, colors.map((c) => {
    let r = 1
    if (Math.random() > 0.5) {
      r = 1.5
    }
    return div({
      style: `flex:${r}; height:100%; background-color:${c};`
    })
  })
  )
}

module.exports = flair

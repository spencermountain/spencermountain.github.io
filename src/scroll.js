require('intersection-observer')
const scrollama = require('scrollama')

const scroller = scrollama()
scroller
  .setup({
    step: '.step'
  })
  .onStepEnter(resp => {})
  .onStepExit(resp => {})

// setup resize event
window.addEventListener('resize', scroller.resize)

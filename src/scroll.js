require('intersection-observer')
const scrollama = require('scrollama')
const tweens = require('./tweens')

// instantiate the scrollama
const scroller = scrollama()

// setup the instance, pass callback functions
scroller
  .setup({
    step: '.step'
  })
  .onStepEnter(response => {
    tweens.top()
    // console.log(response)
    // { element, index, direction }
  })
  .onStepExit(response => {
    // { element, index, direction }
  })

// setup resize event
window.addEventListener('resize', scroller.resize)

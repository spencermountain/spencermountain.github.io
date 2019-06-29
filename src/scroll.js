require('intersection-observer')
const scrollama = require('scrollama')
// const changes = require('./changes')
const htm = require('htm')
const h = htm.bind(require('vhtml'))

// instantiate the scrollama
const scroller = scrollama()

// setup the instance, pass callback functions
scroller
  .setup({
    step: '#hideblue'
  })
  .onStepEnter(resp => {
    if (resp.direction === 'down') {
      resp.element.style.left = '0%'
      // let newEl = h`<div class="slider bgnavy h100p"></div>`
      // resp.element.innerHTML = newEl
    }
  })
  .onStepExit(resp => {
    if (resp.direction === 'up') {
      resp.element.style.left = '-100%'
      // resp.element.innerHTML = ''
    }
  })

// setup resize event
window.addEventListener('resize', scroller.resize)

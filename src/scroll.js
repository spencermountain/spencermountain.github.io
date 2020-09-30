require('intersection-observer')
const scrollama = require('scrollama')
<<<<<<< HEAD
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
=======

const scroller = scrollama()
const sideblue = document.querySelector('#slideblue')
const hidesky = document.querySelector('#hidesky')
const saddam = document.querySelector('#saddam')

scroller
  .setup({
    step: '.trigger'
  })
  .onStepEnter(resp => {
    if (resp.direction === 'down') {
      if (resp.element.id === 'trigger1') {
        sideblue.style.left = '0%'
        hidesky.style.left = '50%'
      }
      if (resp.element.id === 'hide_earth') {
        resp.element.style['background-image'] = 'url(./assets/misc/hay.jpg)'
        setTimeout(() => {
          saddam.style['background-image'] = 'url(./assets/misc/vancouver.jpg)'
        }, 500)
      }
      if (resp.element.id === 'shrinkblue') {
        resp.element.style.width = '50%'
      }
      if (resp.element.id === 'growpink') {
        resp.element.style.width = '50%'
      }
    }
  })
  .onStepExit(resp => {
    if (resp.direction === 'up') {
      if (resp.element.id === 'trigger1') {
        sideblue.style.left = '100%'
        hidesky.style.left = '0%'
      }
      if (resp.element.id === 'hide_earth') {
        resp.element.style['background-image'] = 'url(./assets/misc/satellite.jpg)'
        setTimeout(() => {
          saddam.style['background-image'] = 'url(./assets/misc/saddam.jpg)'
        }, 500)
      }
      if (resp.element.id === 'shrinkblue') {
        resp.element.style.width = '100%'
      }
      if (resp.element.id === 'growpink') {
        resp.element.style.width = '100%'
      }
    }
>>>>>>> master
  })

// setup resize event
window.addEventListener('resize', scroller.resize)

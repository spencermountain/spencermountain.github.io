const pug = require('pug')
const div = require('../../lib/div')
const img = require('../../lib/img')
const link = require('../../lib/link')

class Main {
  constructor() {
    this.el = div('tc', [
      div('pv6 mh4 tr', [
        link('mailto:spencermountain@gmail.com', 'f3 link dim underline lh-title blue', 'I\'m available for work'),
        div('', 'I only do one thing at a time')
      ]),
      div('flex justify-around h5 mw7', [
        link('https://twitter.com/spencermountain', 'link grey dim flex flex-column tc', [
          img('./src/end/icons/twitter.svg', 'w3'),
          div('light-blue', 'twitter')
        ]),
        link('https://www.goodreads.com/user/show/51017977-spencer', 'link grey dim flex flex-column tc', [
          img('./src/end/icons/goodreads.svg', 'w3'),
          div({
            style: {
              color: '#7D5024'
            }
          }, 'goodreads')
        ]),
      ]),
      div('w-100 block f3 tr pr6 pl2 pb3', [
        link('mailto:spencermountain@gmail.com', 'link dim gray b', 'spencermountain@gmail.com')
      ]),
      div('w-100 bg-light-blue h2', {
        style: {
          'background-color': '#408BC9'
        }
      }, [])
    ])

  }

}
module.exports = Main

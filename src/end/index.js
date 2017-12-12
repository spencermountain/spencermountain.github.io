const pug = require('pug')
const div = require('../../lib/div')
const img = require('../../lib/img')
const link = require('../../lib/link')

class Main {
  constructor() {
    this.el = div('tc', [
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
        link('mailto:spencermountain@gmail.com', 'link dim  b avenir bb bw1 b--dim-gray f3 mh2 light-green', 'spencermountain@gmail.com')
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

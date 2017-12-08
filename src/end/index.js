const pug = require('pug')
const div = require('../../lib/div')
const img = require('../../lib/img')
const link = require('../../lib/link')

class Main {
  constructor() {
    this.el = div('relative pv6 mh4 tr', [
      link('mailto:spencermountain@gmail.com', 'f3 link dim underline lh-title blue', 'I\'m available for work'),
      div('', 'I only do one thing at a time')
    ])

  }

}
module.exports = Main

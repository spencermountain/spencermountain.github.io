const React = require('react');
const r = require('r-dom');
const animateArr = require('./animate');

class Grid extends React.Component {
  constructor() {
    super()
    this.state = {
      arr: [10, 30, 50]
    }
    this.css = {}
    let options = {}
    let callback = () => {
      console.log('done!')
    }
    animateArr(this, [1, 2, 3], [23, 45, 23], options, callback)
  }
  render() {
    return r.div({}, [
      r.div([
        'grid'
      ])
    ])
  }
}
module.exports = Grid

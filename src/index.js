const React = require('react');
const ReactDOM = require('react-dom');
const r = require('r-dom');
const Grid = require('./grid');

class Main extends React.Component {
  constructor() {
    super()
    this.state = {}
    this.css = {}
  }
  render() {
    console.log(this.props)
    return r.div({}, [
      r.div([
        'hi2',
        r(Grid, {})
      ])
    ])
  }
}

ReactDOM.render(
  React.createElement(Main, null),
  document.body
);

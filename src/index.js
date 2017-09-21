import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import styler from 'react-styling';
import './index.css';
// import Github from 'react-icons/lib/io/social-github';
// import Twitter from 'react-icons/lib/io/social-twitter';
// import Wiki from 'react-icons/lib/io/android-globe';
// import Email from 'react-icons/lib/io/paper-airplane';
import Flowers from './parts/Flowers';

const assets = {
  CNTower: require('./lib/cntower.svg')
  // goto: require('../assets/goto9.png'),
};
const style = styler`
  container
    display:flex
    flex-direction: column;
    min-height: 100vh;
    max-height: 100vh;
    border:1px solid red;
  main
    flex:1;
    overflow:auto
  scroll:
    border:1px dotted blue
`;
class App extends Component {
  constructor(props) {
    super(props);
    this.css = style;
  }
  render() {
    let { css } = this;
    return (
      <div style={css.container}>
        <Flowers />
        {/* <div style={css.main}>
          <div style={css.scroll} />
        </div> */}
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));

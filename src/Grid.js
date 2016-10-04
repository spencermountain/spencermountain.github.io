import React, { Component } from 'react';
import Anime from 'react-anime';
// import d3Scale from 'd3-scale'

class Grid extends Component {
  section(width, color) {
    return
  }
  render() {
    let css = {
      display: 'block',
      width: 200,
      backgroundColor: 'steelblue'
    }
    return (
      <div >
        <Anime
      easing='linear'
      duration={1000}
      direction='alternate'
      loop={true}
      delay={(el, index) => index * 240}
      width={[200, 400]}>
        { /*{this.section(200, 'steelblue')}*/ }
        <div style={css}>ksks</div>
        </Anime>
      </div>
      );
  }
}

export default Grid;

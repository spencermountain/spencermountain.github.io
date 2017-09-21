import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import styler from 'react-styling';
import { area, line, curveMonotoneX, curveBasisClosed } from 'd3-shape';
const style = styler`
	container
		width:100%
		height:100px
		max-height:100px
		border:1px solid grey
		position:relative
	water
		position:absolute
		bottom: 0px;
		height: 20px;
		width: 100%;
		display: block;
		background-color: steelblue;
		margin: 0px;
`;

class Flowers extends Component {
  constructor(props) {
    super(props);
    this.css = style;
  }
  render() {
    let { css } = this;
    let obj = [
      {
        left: 0,
        right: 150,
        top: 0,
        bottom: 150
      }
      // {
      //   left: 150,
      //   right: 50,
      //   top: 110,
      //   bottom: 10
      // }
      // {
      //   left: 10,
      //   right: 50,
      //   top: 110,
      //   bottom: 10
      // }
    ];
    const path = area()
      .x(d => d.left)
      .x1(d => d.right)
      .y0(d => d.top)
      .y1(d => d.bottom)
      .curve(curveBasisClosed)(obj);

    console.log(path);
    return (
      <div style={css.container}>
        <svg style={{ position: 'relative', left: 100, top: 100, border: '1px solid green' }}>
          <path d={path} strokeWidth={3} fill="green" stroke="green" shapeRendering="geometricPrecision" />;
        </svg>
        foot
        {/* <div style={css.water} /> */}
      </div>
    );
  }
}
module.exports = Flowers;

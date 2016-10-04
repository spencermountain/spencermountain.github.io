//the requestAnimationFrame logic for calling setState each frame
'use strict';
import _ from 'lodash';
import { interpolateArray } from 'd3-interpolate';

//support all prefixed rAF methods
let requestAnimationFrame;
let cancelAnimationFrame;
if (typeof window !== 'undefined') {
  requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
  cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;
}

//what to run each frame
const tick = function() {
  // get current progress of animation (0-1)
  let alpha = ((new Date()).getTime() - this.startTime) / this.duration;
  if (alpha > 1) { //possible, on slow framerates
    alpha = 1;
  }
  this.cmp.state.data = self.interp(alpha);
  this.cmp.setState(this.cmp.state, () => {
    //are we done?
    if (alpha >= 1) {
      this.cmp.state.loader_percent = 0;
      this.cmp._next_frame = undefined;
      return this.callback(self);
    }
    //nope, repeat
    this.cmp._next_frame = requestAnimationFrame(tick.bind(self));
    return null
  });
};

//setup the animation and trigger first frame.
const animateGauge = function(cmp, startArr, endArr, options, callback) {
  options = options || {}
  //cancel existing animations
  if (cmp._next_frame) {
    cancelAnimationFrame(cmp._next_frame);
  }
  //start_data must be deepcloned from state, to avoid a memleak
  startArr = _.cloneDeep(startArr) || [];
  let interp = interpolateArray(startArr, endArr)
  // Kick-off first frame..
  const anim = {
    cmp: cmp,
    interp: interp,
    startTime: (new Date()).getTime(),
    duration: options.duration || 700,
    callback: callback || function() {}
  };
  requestAnimationFrame(tick.bind(anim));
}

module.exports = animateGauge;

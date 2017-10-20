<style scoped>
#flower {
	margin:100px;
}
</style>

<template>
  <div id="flower">
    {{word}}
		<svg>
		  <path v-bind:d="path" fill="green" stroke="steelblue"></path>
	  </svg>
  </div>
</template>

<script>
import flubber from '../lib/flubber.min.js';
import { line, curveBasisClosed } from '../lib/d3.v4.min.js';

export default {
  name: 'Flower',
  props: ['word'],
  data() {
    //random-walk
    let data = [{ x: 0, y: 0 }];
    for (let i = 0; i < 15; i++) {
      let x = Math.random() * 50;
      x = parseInt(x - 25);
      if (x < 0) {
        x = 0;
      }
      data.push({ x: data[i].x + x, y: data[i].y + 50 });
    }
    let path = line()
      .x(d => d.x)
      .y(d => d.y)
      .curve(curveBasisClosed)(data);
    return {
      msg: 'flower',
      path: path
    };
  }
};
</script>

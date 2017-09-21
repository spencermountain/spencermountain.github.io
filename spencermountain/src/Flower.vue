<style scoped>
#flower {
	margin-top:100px;
}
</style>

<template>
  <div id="flower">
    {{word}}
  </div>
</template>

<script>
import flubber from '../lib/flubber.min.js';
import d3 from '../lib/d3.v4.min.js';

export default {
  name: 'Flower',
  props: ['word'],
  data() {
    return {
      msg: 'flower'
    };
  }
};
</script>

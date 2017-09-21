<style scoped>
#main {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

<template>
  <div id="main">
    {{msg}}
     <button @click="sayNo">No</button>
     <div>
       <Flower word="one"/>
       <Flower word="two!"/>
     </div>
  </div>
</template>

<script>
import Flower from './Flower.vue';
export default {
  name: 'main',
  components: {
    Flower
  },
  data() {
    return {
      msg: 'hello!'
    };
  },
  methods: {
    sayNo() {
      this.msg = 'no!';
    }
  }
};
</script>

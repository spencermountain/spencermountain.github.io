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
     <FamilyTree/>
     <!-- <div style="display:flex; position:fixed; bottom:0px;">
       <Flower word="one"/>
       <Flower word="two!"/>
       <Flower word="three!"/>
     </div> -->
  </div>
</template>

<script>
var Flower =require('./Flower.vue')
var FamilyTree =require('./family-tree/index.vue')
export default {
  name: 'main',
  components: {
    Flower,
    FamilyTree
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

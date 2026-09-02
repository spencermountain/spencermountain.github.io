<script setup>
import Intro from './home/Intro.vue'
import SawdustGrid from './home/SawdustGrid.vue'
import GoldGrids from './home/GoldGrids.vue'
import Decline from './home/Decline.vue'
import Toronto from './home/Toronto.vue'
import Age from './home/Age.vue'
import Contact from './home/Contact.vue'

useHead({ title: '🚀✨' })
// the sawdust tile's scroll-trigger also moves a tile in the grids below it
const sawdust = ref(false)
</script>

<template>
  <div>
    <Intro />
    <SawdustGrid v-model="sawdust" />
    <GoldGrids :sawdust="sawdust" />
    <Decline />
    <Toronto />
    <Age />
    <Contact />
  </div>
</template>

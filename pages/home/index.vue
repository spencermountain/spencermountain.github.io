<script setup>
import Intro from './01-Intro.vue'
import Decline from './02-Decline.vue'
import Toronto from './03-Toronto.vue'
import Age from './04-Age.vue'
import Contact from './05-Contact.vue'
import SawdustGrid from './SawdustGrid.vue'
import GoldGrids from './GoldGrids.vue'

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

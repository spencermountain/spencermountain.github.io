<script setup>
import Home from './home/Index.vue'

useHead({ title: '🚀✨' })
// the sawdust tile's scroll-trigger also moves a tile in the grids below it
const sawdust = ref(false)
</script>

<template>
  <Home />
</template>

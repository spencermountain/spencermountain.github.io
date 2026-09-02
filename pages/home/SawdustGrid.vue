<script setup>
import FourGrid from './lib/FourGrid.vue'
import Cell from './lib/Cell.vue'
import { useScrollTrigger } from './lib/useScrollTrigger.js'

// v-model: true while the sawdust tile is scrolled past the trigger line
const active = defineModel({ default: false })
const tile = ref()
useScrollTrigger(tile, active)
</script>

<template>
  <div class="row">
    <FourGrid>
      <Cell />
      <Cell />
      <Cell ref="tile" img="sawdust" tall class="rounded-sm shadow-card" />
      <Cell />
      <Cell bg="brown" />
      <Cell />
      <!-- red slides in over the blue tile -->
      <Cell bg="blue" class="overflow-hidden">
        <div
          class="relative h-full w-full bg-red transition-[left] duration-300 ease-in"
          :class="active ? 'left-0' : 'left-full'"
        />
      </Cell>
      <Cell bg="sky" class="rounded-sm" />
      <Cell wide />
      <Cell />
    </FourGrid>
  </div>
</template>

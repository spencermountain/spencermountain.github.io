<script setup>
import Stage from './lib/Stage.vue'
import GoldGrid from './lib/GoldGrid.vue'
import Cell from './lib/Cell.vue'
import { useScrollTrigger } from './lib/useScrollTrigger.js'

const age = new Date().getFullYear() - 1986
// the pink bar halves its width (slowly) once scrolled to
const bar = ref()
const grown = useScrollTrigger(bar)
</script>

<template>
  <Stage class="mt-46">
    <GoldGrid class="ml-6">
      <Cell wide><img src="/img/more/exhibition.jpg" class="rounded-sm shadow-card" /></Cell>
      <Cell />
      <img src="/img/more/dufferin.jpg" class="w-30 rounded-sm shadow-card" />
      <Cell wide class="col-bottom text-brown">
        i write software
        <div class="h-[0.444rem] w-full bg-blue" />
      </Cell>
      <Cell />
      <Cell />
      <img src="/img/more/statue.jpg" class="w-30 rounded-sm shadow-card" />
      <Cell class="col-bottom text-2xl text-brown">
        <div class="ml-4 self-start">I'm {{ age }}.</div>
      </Cell>
      <div
        ref="bar"
        class="rounded-sm bg-pink transition-[width] duration-600 ease-in"
        :class="grown ? 'w-1/2' : 'w-full'"
      />
      <Cell class="overflow-hidden rounded-sm" />
    </GoldGrid>
    <div class="mt-4 mr-6 max-w-[57.6rem] text-right text-brown">
      i don't know<br />
      how to<br />
      <span class="-mr-6">do anything</span><br />
      else.
    </div>
    <div class="mt-4 ml-9 max-w-[57.6rem] text-left">
      <img class="rounded-sm shadow-card" src="/img/more/stadium.jpg" />
    </div>
  </Stage>
</template>

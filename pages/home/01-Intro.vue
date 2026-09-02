<script setup>
import FourGrid from './lib/FourGrid.vue'
import Cell from './lib/Cell.vue'
import Stage from './lib/Stage.vue'
</script>

<template>
  <section>
    <!-- top collage -->
    <div class="row">
      <FourGrid class="overflow-hidden rounded-sm">
        <Cell />
        <Cell img="boats" wide />
        <Cell bg="pink" />
        <Cell />
        <Cell img="sea" tall />
        <Cell bg="sky" />
        <Cell />
        <Cell bg="pink" />
        <Cell img="orange" bg="pink" />
        <Cell />
      </FourGrid>
    </div>
    <!-- hello -->
    <div class="row-middle relative mt-9 text-[3.375rem] text-grey">
      <div class="absolute -top-5 left-1/4 text-2xl text-sky">Hello</div>
      I'm Spencer Kelly
    </div>
    <!-- picture -->
    <Stage class="my-20">
      <img class="ml-auto w-68 rounded-sm shadow-card" src="/img/full/shelf.jpg" />
    </Stage>
  </section>
</template>

<script setup>
import Stage from './Stage.vue'
</script>

<template>
  <section>
    <!-- toronto -->
    <Stage class="my-20">
      <div class="row">
        <div class="row grow text-2xl">
          <div class="text-left text-brown">
            I'm from Toronto
            <div class="text-base text-red">canada.</div>
          </div>
        </div>
        <div class="relative grow text-left">
          <img src="/img/full/cn-tower.jpg" class="w-68 rounded-sm" />
          <img src="/img/more/n-america-winter.jpg" class="absolute bottom-0 left-[200px] w-30 rounded-sm" />
        </div>
      </div>
    </Stage>
    <!-- apartment -->
    <Stage class="my-20">
      <div class="row flex-nowrap">
        <div class="grow" />
        <div class="row-middle grow flex-nowrap text-left">
          <div><img src="/img/full/desk.jpg" class="w-102 rounded-sm" /></div>
          <div class="col-bottom ml-9 items-start self-stretch">
            <div>i live in a modest apartment.</div>
            <img src="/img/full/github.jpg" class="w-68 rounded-sm shadow-card" />
          </div>
        </div>
      </div>
    </Stage>
  </section>
</template>

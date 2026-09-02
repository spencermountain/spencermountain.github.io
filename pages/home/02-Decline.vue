<script setup>
import Stage from './lib/Stage.vue'
import { useScrollTrigger } from './lib/useScrollTrigger.js'

// the sky bar beside the fields halves its width once scrolled to
const bar = ref()
const shrunk = useScrollTrigger(bar)
</script>

<template>
  <section>
    <!-- software is in decline -->
    <Stage class="my-30">
      <div class="row m-6 flex-nowrap">
        <div class="text-right text-4xl text-sea">
          <div class="text-base text-grey">and</div>
          software<br />
          <a href="http://blog.spencermounta.in/2020/should-we-stop/index.html">is in decline</a>.
        </div>
        <img class="ml-4 rounded-sm shadow-card" src="/img/full/yeast.jpg" />
      </div>
    </Stage>
    <!-- ontario farms -->
    <Stage class="my-20">
      <div class="row flex-nowrap">
        <div class="relative max-w-[800px] grow">
          <img class="rounded-sm shadow-card" src="/img/full/fields.jpg" />
          <div class="absolute bottom-1/4 h-4 w-full bg-pink opacity-80" />
        </div>
        <div class="ml-6 grid w-1/4 grid-cols-2 self-stretch">
          <div />
          <div />
          <div />
          <div
            ref="bar"
            class="rounded-sm bg-sky transition-[width] duration-300 ease-in"
            :class="shrunk ? 'w-1/2' : 'w-full'"
          />
          <div />
          <div />
          <div class="rounded-sm bg-red" />
        </div>
      </div>
    </Stage>
    <!-- aliens -->
    <div class="row-middle my-46">
      <div class="w-[25.6rem] text-right text-2xl text-brown">
        if aliens ever land,<br />
        we'll board their ship<br />
        and discover that they have<br />
        <span class="text-4xl text-navy">a better internet</span><br />
        than we do.
      </div>
    </div>
    <!-- portfolio -->
    <Stage class="my-30">
      <div class="row-middle">
        <div>
          <NuxtLink to="/portfolio" class="clean border-blue text-[3.375rem] font-bold text-plum">Portfolio</NuxtLink>
          <span class="ml-4 text-2xl text-navy"> ➡</span>
        </div>
      </div>
    </Stage>
  </section>
</template>

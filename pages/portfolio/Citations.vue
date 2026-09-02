<script setup>
import Main from './Main.vue'
import Dot from './Dot.vue'
import citations from './citations.js'
</script>

<template>
  <Main class="mt-16">
    <div class="row justify-normal">
      <div class="text-[2rem]">citations:</div>
      <img class="m-5 ml-12 rounded-sm shadow-card" src="/img/2010/piano.gif" />
    </div>
    <div class="my-5 pl-10">
      <div v-for="c in citations" :key="c.href">
        <Dot :project="c.project" />
        <a :href="c.href">{{ c.title }}</a>
        <div class="pl-10">{{ c.source }}</div>
      </div>
    </div>
  </Main>
</template>

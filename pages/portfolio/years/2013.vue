<script setup>
import Main from '../lib/Main.vue'
import Year from '../lib/Year.vue'
import Img from '../lib/Img.vue'
</script>

<template>
  <Main class="mt-20">
    <Year id="2013">
      <div class="row">
        <div class="w-1/2">
          <Img src="/img/2013/london.jpg" width="350px" href="https://state.com/" />
        </div>
        <div class="w-1/2">
          <Img src="/img/2013/2013.jpg" width="150px" />
          <Img src="/img/2013/Tree.png" width="150px" />
        </div>
      </div>
      <div class="mt-20 mb-1 ml-8">
        state.com hires 45 people
        <div class="my-1 ml-8 text-[0.9rem] italic">all will be laid-off the next year.</div>
        <Img src="/img/2013/alex-techcrunch.jpg" width="350px" href="https://www.youtube.com/watch?v=PAymdN2T5oI" />
      </div>
      <div class="mt-20 ml-32 max-w-[35rem]">webby nomination - <i>best community, 2013</i></div>
      <div class="m-12">
        <Img src="/img/2013/deceased-persons.png" width="250px" />
      </div>
      <Img src="/img/2013/mturk.jpg" width="320px" />
      <div class="mt-12 mb-1 ml-16 text-[0.9rem] italic">
        <div>Freebase shuts-down.</div>
        <div>React and D3 are both created.</div>
      </div>
    </Year>
  </Main>
</template>

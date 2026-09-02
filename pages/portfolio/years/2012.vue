<script setup>
import Main from '../Main.vue'
import Year from '../Year.vue'
import Img from '../Img.vue'
</script>

<template>
  <Main class="mt-20">
    <Year id="2012">
      <div class="row">
        <div class="w-1/2">
          <Img src="/img/2012/london.jpg" width="250px" />
        </div>
        <div class="w-1/2">
          <div>moved to Britain</div>
          <div class="my-1 ml-8 text-[0.9rem] italic">for <a href="https://state.com/">State.com</a> startup</div>
        </div>
      </div>
      <div class="mt-12">
        <Img src="/img/2012/sky.jpg" width="200px" />
      </div>
      <div class="mt-12">
        <div class="mr-12 text-right text-[0.9rem] italic">'london in the rain is beautiful'</div>
        <Img src="/img/2012/opinion.png" width="300px" />
      </div>
      <div class="mt-12">
        <Img src="/img/2012/mars.jpg" width="550px" />
      </div>
    </Year>
  </Main>
</template>

<script setup>
import Main from '../Main.vue'
import Year from '../Year.vue'
import Img from '../Img.vue'
</script>

<template>
  <Main class="mt-20">
    <Year id="2015">
      <Img src="/img/2015/2015.jpg" width="150px" />
      <Img src="/img/2015/toronto.jpg" width="250px" caption="moved to Toronto" />
      <div class="mt-8 text-[0.9rem]">pension vizualizations for <a href="https://govinvest.com/">govInvest</a></div>
      <Img src="/img/2017/govdna.png" width="450px" />
      <div class="my-1 ml-8">
        <Img src="/img/2015/govinvest2.jpg" width="300px" />
      </div>
      <div class="mt-12">
        <Img src="/img/2015/playoffs.jpg" width="400px" caption="blue jays win ALDS<br />but lose semi-final" />
      </div>
    </Year>
  </Main>
</template>

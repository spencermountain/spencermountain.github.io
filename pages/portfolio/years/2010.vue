<script setup>
import Main from '../Main.vue'
import Year from '../Year.vue'
import Img from '../Img.vue'
import Hr from '../Hr.vue'
</script>

<template>
  <Main class="mt-20">
    <Year id="2010">
      <div>English Text simplification</div>
      <Img
        src="/img/2010/simple.jpg"
        width="450px"
        href="https://docs.google.com/spreadsheets/d/1clPt1ivBcf5Kdi02NzoE_KqEMXNylj6q-88qXuvw1lY/edit?usp=sharing"
      />
      <div class="my-5 pl-10">frequently cited as <i>'the most naive' simplification of english</i></div>
      <div class="mt-16 ml-8"><b>wikipedia bot</b> accepted on en.wikipedia</div>
      <div class="ml-16 italic">filled-in citation data until 2012.</div>
    </Year>
    <Hr />
  </Main>
</template>

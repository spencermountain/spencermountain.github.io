<script setup>
import Main from '../lib/Main.vue'
import Year from '../lib/Year.vue'
import Img from '../lib/Img.vue'
import Hr from '../lib/Hr.vue'
</script>

<template>
  <Main class="mt-16">
    <Year id="2018">
      <div class="row">
        <div class="w-1/2">
          <Img
            src="/img/2018/geneology.png"
            width="450px"
            caption="did my genealogy. it was hard."
            href="http://blog.spencermounta.in/2019/my-family-tree/index.html"
          />
          <Img src="/img/2018/cheese-maker.png" width="250px" />
        </div>
        <div class="w-1/2">
          <Img src="/img/2018/mars.jpg" width="350px" />
          <Img
            src="/img/2018/begin-cli.gif"
            width="350px"
            href="https://observablehq.com/@spencermountain/compromise-dates"
          />
          <div class="my-5 pl-10">
            a date-parser for natural language
            <div class="my-1 ml-8 text-[0.9rem] italic">for <a href="https://begin.com">begin.com</a></div>
          </div>
        </div>
      </div>
      <div class="row mt-16">
        <div class="w-1/2">
          <Img src="/img/2018/spacetime.jpg" width="250px" href="https://github.com/spencermountain/spacetime" />
          <Img src="/img/2018/spacetime.gif" width="250px" href="https://github.com/spencermountain/spacetime" />
        </div>
        <div class="w-1/2">
          <div>a timezone library</div>
          <div class="italic">also hard.</div>
        </div>
      </div>
      <div class="my-1 ml-16">
        <Img src="/img/2019/colors.png" width="280px" />
      </div>
      <Hr />
    </Year>
  </Main>
</template>

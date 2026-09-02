<script setup>
import Main from '../Main.vue'
import Year from '../Year.vue'
import Img from '../Img.vue'
</script>

<template>
  <Main class="mt-16">
    <Year id="2019">
      <div class="row">
        <div class="w-1/2">
          <Img src="/img/2019/v12.png" width="380px" href="https://observablehq.com/@spencermountain/compromise-values" />
        </div>
        <div class="w-1/2">
          <Img src="/img/2019/2019.jpg" width="150px" />
          <Img src="/img/2019/dumps.png" width="150px" href="http://thensome.how/2019/ontario-landfills/" />
          <Img
            src="/img/2019/globe.jpg"
            width="150px"
            href="http://blog.spencermounta.in/2019/understanding-the-planet/index.html"
          />
        </div>
      </div>
      <div class="m-16 pl-10 italic">
        compromise running in the NHS
        <div class="my-1 ml-8 text-[0.9rem]">for <a href="http://mbihealthgroup.com/">MBI health</a>.</div>
      </div>
      <div class="row mt-16">
        <Img src="/img/2019/twitter.png" width="380px" />
        <Img src="/img/2019/2019-2.jpg" width="120px" />
      </div>
      <div class="row mt-12 mb-1 ml-8 justify-normal">
        <div>
          <div class="italic">
            a realtime layout solver
            <div class="my-1 ml-8 text-[0.9rem]">for <a href="https://venngage.com/">venngage.com</a></div>
          </div>
        </div>
        <Img src="/img/2019/venngage.jpg" width="60px" />
      </div>
    </Year>
  </Main>
</template>

<script setup>
import Main from '../lib/Main.vue'
import Year from '../lib/Year.vue'
import Img from '../lib/Img.vue'
</script>

<template>
  <Main class="mt-20">
    <Year id="2014">
      <div>went to grad school for a short time.</div>
      <div class="row">
        <div class="w-1/2">
          <Img src="/img/2014/gradschool.jpg" width="150px" />
        </div>
        <div class="w-1/2">
          <div class="mt-8">
            <Img src="/img/2014/digraph-genealogy.jpg" width="150px" />
          </div>
        </div>
      </div>
      <div class="mt-16 mb-5 pl-10 italic">
        granted this weird software patent
        <a href="https://patents.google.com/patent/US20150089409A1/en">
          <Img src="/img/2014/state-patent.jpg" width="450px" />
        </a>
      </div>
      <div class="row mt-12">
        <div class="w-[230px]">
          <Img src="/img/2014/earthbarely1.jpg" width="250px" />
        </div>
        <div class="ml-4 w-1/2">
          <Img src="/img/2014/earthbarely2.jpg" width="250px" />
          <div class="text-[0.9rem] text-grey italic">CUSEC14 hackathon finalist</div>
          <Img src="/img/2014/floor-walk.jpg" width="250px" href="https://vimeo.com/103858377" />
        </div>
      </div>
    </Year>
  </Main>
</template>

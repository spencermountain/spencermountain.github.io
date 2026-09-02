<script setup>
import Main from '../lib/Main.vue'
import Year from '../lib/Year.vue'
import Img from '../lib/Img.vue'
</script>

<template>
  <Main class="mt-12">
    <Year id="2022">
      <div class="row ml-8 justify-start">
        <div>
          <Img
            src="/img/2022/v14.jpg"
            width="350px"
            href="https://github.com/spencermountain/compromise/releases/tag/14.0.0"
          />
          <div>released v14 <div class="text-[0.9rem]">of compromise</div></div>
          <div class="text-[0.9rem] italic">
            it was <a href="https://github.com/spencermountain/compromise/compare/14.0.0...master">hard</a>
          </div>
          <div class="w-1/2" />
        </div>
      </div>
      <div class="row mr-8 max-w-[80%] pr-[6em]">
        <Img src="/img/2022/mayor.jpg" width="150px" href="https://vimeo.com/29689919" />
      </div>
      <div class="row">
        <div>
          <Img src="/img/2022/concert.jpg" caption="first concert back" />
          <Img src="/img/2022/kaaate.jpg" width="110px" />
        </div>
      </div>
      <div class="row justify-start">
        <Img src="/img/2022/trie.jpg" width="200px" />
        <div>
          <a href="https://youtu.be/6DBDBcoMopQ?t=619">future of text</a> presentation
          <div class="my-1 ml-8 text-[0.9rem]">on suffix compression</div>
        </div>
      </div>
      <div class="row">
        <Img src="/img/2022/hurricane.jpg" width="200px" />
      </div>
      <Img src="/img/2022/transit-lines.jpg" href="https://toronto.cityhallwatcher.com/p/chw196" />
      <div>
        guest post on <a href="https://toronto.cityhallwatcher.com/p/chw196">Graphic Matt's newsletter</a>
        <div class="my-1 ml-8 text-[0.9rem]">about the housing crisis in Toronto</div>
      </div>
      <div class="row flex-nowrap justify-start">
        <Img src="/img/2022/sky.jpg" width="300px" />
        <div class="flex flex-col items-center justify-around self-stretch p-4">
          <Img src="/img/2022/model.jpg" width="250px" />
          <Img src="/img/2022/horizon.jpg" width="300px" />
        </div>
      </div>
      <div class="row justify-end text-right">
        <div>
          <div><a href="https://github.com/spencermountain/fr-compromise">french</a></div>
          <div><a href="https://github.com/spencermountain/es-compromise">spanish</a></div>
          <div><a href="https://github.com/spencermountain/de-compromise">german</a></div>
          <div>
            <a href="https://github.com/spencermountain/it-compromise">italian</a>
            <div class="my-1 ml-8">in production →</div>
          </div>
        </div>
        <Img src="/img/2022/italian.jpg" width="340px" />
      </div>
      <div class="row justify-end text-right">
        <div class="flex flex-col items-center justify-around self-stretch">
          <div class="row justify-end text-right">
            <Img src="/img/2022/truck.jpg" width="200px" />
          </div>
        </div>
      </div>
      <div class="row items-start justify-end text-right">
        <Img src="/img/2022/swirl.jpg" width="300px" />
      </div>
    </Year>
  </Main>
</template>

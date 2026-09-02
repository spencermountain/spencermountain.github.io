<script setup>
import Main from '../lib/Main.vue'
import Year from '../lib/Year.vue'
import Img from '../lib/Img.vue'
import Mov from '../lib/Mov.vue'
</script>

<template>
  <Main class="mt-12">
    <Year id="2020">
      <div class="row">
        <div class="w-1/2">
          <Img src="/img/2020/sankey.jpg" width="150px" href="https://github.com/spencermountain/somehow-sankey" />
          <Img src="/img/2020/rockets.png" width="150px" href="https://github.com/spencermountain/somehow-timeline" />
          <div class="mt-16">
            <Img
              src="/img/2020/covid.png"
              width="150px"
              href="https://www.reddit.com/r/dataisbeautiful/comments/fkwova/oc_rna_sequence_of_covid19_this_8kb_of_data_is/"
            />
            <div class="my-1 ml-16 text-right font-mono text-[0.6rem] text-orange">
              <div>nhs-covid using compromise &nbsp; &nbsp;</div>
              <div>covid-atlas using spacetime <a href="https://github.com/covidatlas/coronadatascraper">[1]</a></div>
              <div>
                trackers parsing wikipedia
                <a href="https://observablehq.com/@spencermountain/parsing-wikipedias-coronavirus-outbreak-data">[2]</a>
              </div>
            </div>
          </div>
        </div>
        <div class="w-1/2">
          <Img src="/img/2020/skydome.jpg" width="200px" href="http://thensome.how/2020/covid-as-skydome/" />
          <Img src="/img/2020/2020.jpg" width="250px" />
        </div>
      </div>
      <div class="m-16">
        <Img
          src="/img/2020/fr-compromise.png"
          width="450px"
          caption="compromise-community begins<br /><i>french-language conjugation</i>"
          link="https://github.com/nlp-compromise/fr-compromise"
        />
      </div>
      <div class="row">
        <div>
          <div class="my-1 ml-8 text-[0.9rem] italic">
            Guest interview on podcast -
            <a href="https://www.stitcher.com/show/the-amateur/episode/how-to-learn-programming-68480006">How to learn programming</a>
          </div>
        </div>
      </div>
      <div class="mt-16">
        <Mov
          src="/img/2020/fast-mode.mp4"
          width="450px"
          href="https://github.com/spencermountain/compromise/tree/master/plugins/scan"
          caption='compromise became fast<br /><i>contract w/ <a href="https://moov.co/">Moov.co</a></i>'
        />
      </div>
      <div class="mt-16">
        <Mov
          src="/img/2020/hand-computer.mp4"
          width="250px"
          href="http://blog.spencermounta.in/2020/computer-is-furniture/index.html"
        />
      </div>
      <div class="row">
        <div class="w-1/2">
          <Img src="/img/2020/wayne.jpg" width="150px" />
          <Img src="/img/2019/blender.jpg" width="175px" />
        </div>
        <div class="w-1/2">
          <Img src="/img/2020/sport-season.png" width="250px" href="http://thensome.how/2018/sports-by-city/" />
          <Img
            src="/img/2020/calendar.png"
            width="200px"
            href="http://blog.spencermounta.in/2019/millenial-calendar/index.html"
          />
        </div>
      </div>
      <div class="mt-20">
        <Img src="/img/2020/gun-and-rose.png" width="350px" href="https://observablehq.com/@spencermountain/nouns" />
      </div>
    </Year>
  </Main>
</template>

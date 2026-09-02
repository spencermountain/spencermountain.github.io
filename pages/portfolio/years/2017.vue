<script setup>
import Main from '../Main.vue'
import Year from '../Year.vue'
import Img from '../Img.vue'
import Hr from '../Hr.vue'
</script>

<template>
  <Main class="mt-20">
    <Year id="2017">
      <Img
        src="/img/2017/tests-failing.png"
        width="500px"
        caption="compromise v12"
        href="https://github.com/spencermountain/compromise/wiki/v12-Release-Notes"
      />
      <div class="row mt-12">
        <div class="w-1/2">
          <Img src="/img/2017/who-ordinal.png" width="350px" />
          <div class="mt-8">
            <Img src="/img/2017/2017.jpg" width="175px" />
          </div>
          <div class="mt-12">
            <Img
              src="/img/2017/dumpster.gif"
              width="400px"
              href="https://github.com/spencermountain/dumpster-dive/"
              caption="system for parsing wikipedia<br />in-use at Wolfram Alpha"
            />
          </div>
        </div>
        <div class="w-1/2">
          <Img
            src="/img/2017/wtf-wikipedia.png"
            width="225px"
            caption="some of wikipedia's 600-thousand templates"
            href="https://github.com/spencermountain/wtf_wikipedia/"
          />
          <Img src="/img/2017/japan.jpg" width="150px" />
        </div>
      </div>
      <div class="mt-20 ml-12">
        compromise in use
        <a href="https://devblogs.microsoft.com/cse/2017/06/06/geocoding-social-conversations-nlp-javascript/">at the United Nations</a>
      </div>
      <Hr />
    </Year>
  </Main>
</template>

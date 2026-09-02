<script setup>
import Main from '../lib/Main.vue'
import Year from '../lib/Year.vue'
import Img from '../lib/Img.vue'
import Video from '../lib/Video.vue'
</script>

<template>
  <Main class="mt-12">
    <Year id="2021">
      <div class="row">
        <div class="w-1/2">
          <Img src="/img/2021/lockdown.jpg" />
          <div>months of lockdown</div>
        </div>
      </div>
      <Video vimeo="496095722" />
      <div class="mt-16">NLP-OSS presentation</div>
      <div class="mt-20">
        <Img
          src="/img/2021/newton.jpg"
          width="400px"
          href="https://twitter.com/jmitch/status/1369735601004703746"
          caption="date-parser for Newton email client "
        />
      </div>
      <div class="mt-20">
        <Img src="/img/2021/fluent.jpg" width="400px" href="https://www.fluent.co/" caption="translation forfluent.co" />
      </div>
    </Year>
  </Main>
</template>

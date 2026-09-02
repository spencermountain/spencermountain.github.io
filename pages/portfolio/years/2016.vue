<script setup>
import Main from '../Main.vue'
import Year from '../Year.vue'
import Img from '../Img.vue'
import Video from '../Video.vue'
import Hr from '../Hr.vue'
</script>

<template>
  <Main class="mt-20">
    <Year id="2016">
      <div class="row">
        <div class="w-1/2">
          <Img src="/img/2016/map.jpg" width="250px" />
          <div class="mt-8">
            <Img src="/img/2016/yonge-street.jpg" width="200px" />
          </div>
        </div>
        <div class="w-1/2">
          <Img src="/img/2016/old.jpg" width="200px" />
        </div>
      </div>
      <div class="mt-12">
        <Img src="/img/2016/trending.jpg" width="450px" />
      </div>
      <div class="mt-12">
        <Video youtube="WuPVS2tCg8s" />
      </div>
      <div class="row">
        <div class="w-1/2" />
        <div class="w-1/2">
          <div class="mt-12">
            <Img src="/img/2016/montreal.jpg" width="200px" />
          </div>
        </div>
      </div>
      <Hr />
    </Year>
  </Main>
</template>

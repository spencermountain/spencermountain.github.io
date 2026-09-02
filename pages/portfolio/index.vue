<script setup>
import Y2022 from './years/2022.vue'
import Y2021 from './years/2021.vue'
import Y2020 from './years/2020.vue'
import Y2019 from './years/2019.vue'
import Y2018 from './years/2018.vue'
import Y2017 from './years/2017.vue'
import Y2016 from './years/2016.vue'
import Y2015 from './years/2015.vue'
import Y2014 from './years/2014.vue'
import Y2013 from './years/2013.vue'
import Y2012 from './years/2012.vue'
import Y2011 from './years/2011.vue'
import Y2010 from './years/2010.vue'
import Citations from './Citations.vue'

useHead({ title: '•' })
</script>

<template>
  <!-- the portfolio keeps its own look: serif, 1.2rem text with a fixed 24px line-height -->
  <div class="portfolio min-h-screen overflow-x-hidden bg-white pt-5 font-serif text-[1.2rem] leading-6 text-[#4d4d4d]">
    <!-- tiny header: back to the home page -->
    <div class="row justify-start font-mono text-[0.8rem] italic">
      <NuxtLink to="/" class="border-b border-transparent">〱&nbsp;</NuxtLink>
      <div>spencer kelly</div>
    </div>
    <Y2022 />
    <Y2021 />
    <Y2020 />
    <Y2019 />
    <Y2018 />
    <Y2017 />
    <Y2016 />
    <Y2015 />
    <Y2014 />
    <Y2013 />
    <Y2012 />
    <Y2011 />
    <Y2010 />
    <Citations />
    <div class="h-16" />
  </div>
</template>

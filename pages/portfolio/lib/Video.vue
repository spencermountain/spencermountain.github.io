<script setup>
// responsive 16:9 embed of a youtube or vimeo video, by id
const props = defineProps({ youtube: String, vimeo: String, caption: { type: String, default: '' } })
const src = computed(() =>
  props.youtube
    ? `https://www.youtube-nocookie.com/embed/${props.youtube}`
    : `https://player.vimeo.com/video/${props.vimeo}?byline=0&portrait=0`
)
</script>

<template>
  <div class="w-full">
    <div class="relative aspect-video w-full overflow-hidden">
      <iframe
        :src="src"
        class="absolute inset-0 h-full w-full rounded-md shadow-card"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
      />
    </div>
    <div v-if="caption" class="text-right text-[13px] leading-[200%]" v-html="caption" />
  </div>
</template>

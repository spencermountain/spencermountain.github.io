<script setup>
// right-aligned looping silent video with an optional link and html caption
const props = defineProps({
  src: String,
  caption: { type: String, default: '' },
  href: String,
  link: String,
  width: { type: String, default: '100%' }
})
const url = computed(() => props.link || props.href || null)
</script>

<template>
  <div class="flex flex-col items-end text-right">
    <component :is="url ? 'a' : 'div'" :href="url" :target="url && '_blank'">
      <video :src="src" :style="{ width }" class="m-5 mb-0 max-w-full rounded-sm shadow-card" autoplay muted loop playsinline />
    </component>
    <div v-if="caption" class="text-[0.9rem]" v-html="caption" />
  </div>
</template>

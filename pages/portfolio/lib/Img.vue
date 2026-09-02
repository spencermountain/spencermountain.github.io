<script setup>
// right-aligned image with an optional link and html caption. width is any css width
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
      <img :src="src" :alt="caption" :style="{ width }" class="m-5 mb-0 rounded-sm shadow-card" />
    </component>
    <div v-if="caption" class="text-[0.9rem]" v-html="caption" />
  </div>
</template>

<script setup>
// pink divider with optional small captions above and below it
defineProps({ text: { type: String, default: '' }, bottom: { type: String, default: '' } })
</script>

<template>
  <div class="my-20 w-full">
    <div class="mr-[30%] text-right text-[60%] text-[#735873]">{{ text }}</div>
    <div class="mx-auto mt-14 mb-2 h-px w-[70%] bg-pink" />
    <div class="mr-[30%] text-right text-[60%] text-[#735873]">{{ bottom }}</div>
  </div>
</template>

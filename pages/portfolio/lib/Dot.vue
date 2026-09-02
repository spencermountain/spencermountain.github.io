<script setup>
import colors from '~/assets/colors.js'

// small coloured square marking which project a citation is about
const props = defineProps({ project: { type: String, default: '' } })
const projects = { compromise: colors.blue, wikipedia: colors.sea, freebase: colors.green, simple: '#e6b3bc' }
const color = computed(() => projects[props.project] || 'steelblue')
</script>

<template>
  <div class="mt-5 mr-[15px] inline-block h-[15px] w-[15px] rounded-[20%]" :style="{ backgroundColor: color }" />
</template>

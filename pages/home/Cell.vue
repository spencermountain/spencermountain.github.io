<script setup>
import colors from '~/assets/colors.js'
import { misc } from './config.js'

// one tile of a grid. wide = 2 columns, tall = 2 rows. img is a name from /img/misc
const props = defineProps({ bg: String, img: String, wide: Boolean, tall: Boolean })
const style = computed(() => ({
  backgroundColor: colors[props.bg],
  backgroundImage: props.img && `url(${misc(props.img)})`
}))
</script>

<template>
  <div :class="{ 'col-span-2': wide, 'row-span-2': tall }" :style="style">
    <slot />
  </div>
</template>

<template>
  <!-- 6-column tile grid (150px max per column), 4 columns on tablets -->
  <div class="grid h-[16.5rem] grid-cols-[repeat(6,minmax(50px,150px))] max-[900px]:grid-cols-[1fr_1.618fr_1fr_1.618fr]">
    <slot />
  </div>
</template>

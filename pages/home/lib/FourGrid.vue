<template>
  <!-- 4x3 golden-ratio grid. grows to fill its row, up to ~38rem -->
  <div class="grid h-68 max-w-[38.4rem] grow grid-cols-[0.618fr_1fr_0.618fr_1fr] grid-rows-[1fr_0.618fr_1fr]">
    <slot />
  </div>
</template>

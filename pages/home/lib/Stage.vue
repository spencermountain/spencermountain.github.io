<template>
  <!-- centered content column: 61.8% of the page (golden ratio), full-width with a small gutter on phones -->
  <div class="flex justify-center">
    <div class="w-full max-w-[1000px] px-2 min-[551px]:w-[61.8%] min-[551px]:px-0">
      <slot />
    </div>
  </div>
</template>

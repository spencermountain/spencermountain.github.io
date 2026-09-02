<script setup>
import Stage from './Stage.vue'
import GoldGrid from './GoldGrid.vue'
import Cell from './Cell.vue'
import { useScrollTrigger } from './useScrollTrigger.js'
import { swapDelay } from './config.js'

defineProps({ sawdust: Boolean }) // set by the sawdust grid above
// the satellite tile swaps to hay, and the tall tile in the next grid follows a beat later
const satellite = ref()
const earth = useScrollTrigger(satellite)
const tallImg = ref('saddam')
watch(earth, v => setTimeout(() => (tallImg.value = v ? 'vancouver' : 'saddam'), swapDelay))
</script>

<template>
  <Stage>
    <!-- horse -->
    <GoldGrid class="my-30">
      <Cell />
      <Cell />
      <Cell img="church" tall />
      <Cell bg="pink" />
      <Cell />
      <Cell />
      <Cell class="relative">
        <div
          class="relative h-full w-1/2 bg-sky transition-[left] duration-300 ease-in"
          :class="sawdust ? 'left-1/2' : 'left-0'"
        />
      </Cell>
      <Cell img="victoria-cow" />
    </GoldGrid>
    <!-- worried -->
    <GoldGrid class="my-30">
      <Cell bg="pink" tall />
      <Cell />
      <Cell />
      <Cell img="venus" />
      <Cell />
      <Cell bg="sky" wide />
      <Cell />
      <Cell class="text-right text-2xl text-brown">i'm<br />worried</Cell>
    </GoldGrid>
    <!-- small clouds -->
    <GoldGrid class="my-30 max-h-40">
      <Cell />
      <Cell />
      <Cell tall />
      <Cell bg="pink" />
      <Cell />
      <Cell ref="satellite" bg="grey" :img="earth ? 'hay' : 'satellite'" />
      <Cell />
      <Cell wide />
    </GoldGrid>
    <!-- mushrooms -->
    <GoldGrid class="my-30">
      <Cell />
      <Cell :img="tallImg" tall />
      <Cell bg="pink" />
      <Cell bg="blue" wide />
      <Cell bg="brown" img="mushrooms" />
      <Cell />
      <Cell bg="red" />
      <Cell bg="sky" img="house" />
    </GoldGrid>
    <!-- computers don't work -->
    <GoldGrid class="my-30">
      <Cell />
      <Cell bg="pink" />
      <Cell tall />
      <Cell wide class="m-4 max-w-30 text-4xl text-plum">
        <span class="text-sea">computers</span> <span class="text-navy">do not work </span>
        <span class="text-2xl whitespace-nowrap">very well</span>
      </Cell>
      <Cell img="flood" class="h-30" />
      <Cell />
      <Cell bg="red" />
      <Cell />
    </GoldGrid>
    <!-- cement house -->
    <GoldGrid class="my-30">
      <Cell />
      <Cell img="europa" />
      <Cell bg="grey" img="cement-house" tall wide />
      <Cell />
      <Cell img="hay" />
      <Cell />
      <Cell bg="grey" />
      <Cell bg="brown" />
      <Cell class="col-bottom text-2xl text-sea">and,</Cell>
    </GoldGrid>
    <!-- a mess -->
    <GoldGrid class="my-30">
      <Cell bg="red" />
      <Cell bg="brown" />
      <Cell class="m-4 text-4xl text-dimgrey">
        <div class="whitespace-nowrap">things are</div>
        <div class="whitespace-nowrap">a mess.</div>
      </Cell>
      <Cell tall />
      <Cell />
      <Cell bg="sky" wide />
      <Cell bg="sky" img="grandfather" class="min-h-5 min-w-40" />
      <Cell bg="brown" />
    </GoldGrid>
  </Stage>
</template>

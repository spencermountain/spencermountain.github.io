<script setup>
import spacetime from 'spacetime'
import colors from '../../../assets/colors.js'
import jobs from './jobs.js'
import events from './events.js'

useHead({ title: 'timeline' })

// -- tunable layout --
const rowH = 46 // bar height, px
const rowGap = 10 // vertical space between rows, px
const topRoom = 110 // space above the bars, for event labels
const tickCount = 6 // rough number of x-axis labels

// date-scale: spacetime epochs, mapped 0-100% across the chart
const epoch = (str) => spacetime(str).epoch
const min = Math.min(...jobs.map((j) => epoch(j.start)))
const max = Math.max(...jobs.map((j) => epoch(j.end)))
const pct = (e) => ((e - min) / (max - min)) * 100

const rows = Math.max(...jobs.map((j) => j.row || 1))
const plotH = topRoom + rows * (rowH + rowGap)

const bars = jobs.map((j) => ({
  ...j,
  left: pct(epoch(j.start)),
  width: pct(epoch(j.end)) - pct(epoch(j.start)),
  bottom: ((j.row || 1) - 1) * (rowH + rowGap),
  barH: rowH * (parseInt(j.height) / 100 || 1), // height: '50%' makes a half-size bar
  bg: colors[j.color] || j.color || colors.grey,
  tip: [j.description, j.detail].filter(Boolean).join(' — ')
}))

// point-in-time markers: a label with a thin line down to the bottom row
const markers = events.map((e) => ({ ...e, left: pct(epoch(e.date)) }))

// year labels along the bottom: evenly-stepped january 1sts, spacetime-ticks style
const years = spacetime(max).year() - spacetime(min).year()
const step = Math.max(1, Math.ceil(years / tickCount))
let cur = spacetime(min).startOf('year')
if (cur.epoch < min) cur = cur.add(1, 'year')
const ticks = []
while (cur.epoch < max) {
  ticks.push({ label: String(cur.year()), epoch: cur.epoch })
  cur = cur.add(step, 'year')
}
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-white pt-5 font-serif text-[#4d4d4d]">
    <!-- tiny header: back to the portfolio -->
    <div class="row justify-start font-mono text-[0.8rem] italic">
      <NuxtLink to="/portfolio" class="border-b border-transparent">〱&nbsp;</NuxtLink>
      <div>timeline</div>
    </div>

    <div class="mx-auto mt-20 w-[94%] max-w-6xl">
      <!-- plot area - everything is bottom-anchored and positioned in % of the date-range -->
      <div class="relative" :style="{ height: plotH + 'px' }">
        <div
          v-for="m in markers"
          :key="m.title"
          class="absolute top-0"
          :style="{ left: m.left + '%', bottom: rowH + rowGap + 'px' }"
        >
          <div class="absolute -translate-x-1/2 whitespace-nowrap text-[1.05rem] text-dimgrey">{{ m.title }}</div>
          <div class="absolute top-9 bottom-0 w-px bg-lightgrey"></div>
        </div>

        <div
          v-for="b in bars"
          :key="b.label + b.start"
          class="absolute rounded-md shadow-card"
          :title="b.tip"
          :style="{ left: b.left + '%', width: b.width + '%', bottom: b.bottom + 'px', height: b.barH + 'px', background: b.bg }"
        >
          <div v-if="b.labelPosition === 'above'" class="absolute bottom-full left-0 mb-1 whitespace-nowrap italic text-dimgrey">
            {{ b.label }}
          </div>
          <div v-else class="row-middle h-full overflow-hidden whitespace-nowrap text-[1.05rem] text-white">{{ b.label }}</div>
        </div>
      </div>

      <!-- x-axis year labels -->
      <div class="relative mt-3 h-8 text-dimgrey">
        <div v-for="t in ticks" :key="t.epoch" class="absolute -translate-x-1/2" :style="{ left: pct(t.epoch) + '%' }">
          {{ t.label }}
        </div>
      </div>
    </div>
  </div>
</template>

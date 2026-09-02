import { ref, onMounted, onUnmounted } from 'vue'
export const triggerOffset = 0.5 // where scroll-triggers fire, as a fraction of the viewport height

// true once `el` scrolls up past a line at `offset` of the viewport, false again when it scrolls back below.
// pass your own ref (eg. a v-model) as `state` to write into it
export function useScrollTrigger(el, state = ref(false), offset = triggerOffset) {
  let io
  onMounted(() => {
    const node = el.value?.$el || el.value // template refs on components give the instance
    const pct = offset * 100
    io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) state.value = true
        else if (e.boundingClientRect.top > innerHeight * offset) state.value = false // left downwards
      },
      // shrink the root to a thin band around the trigger line
      { rootMargin: `-${pct - 0.5}% 0px -${99.5 - pct}% 0px` }
    )
    io.observe(node)
  })
  onUnmounted(() => io?.disconnect())
  return state
}

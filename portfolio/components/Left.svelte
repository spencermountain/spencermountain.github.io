<script>
  export let size = '20px'
  export let color = 'steelblue'
  export let href = '#'
</script>

<style>
  .arrow {
    cursor: pointer;
    border-bottom: 1px solid transparent;
  }
</style>

<a {href} class="arrow">
  <svg width={size} height={size} viewBox="0 0 246 342">
    <g stroke={color} stroke-width="50" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M0.5,157.5 L225.231393,0.746048942" />
      <path d="M1.5,157.5 L221.178367,321.260237" />
    </g>
  </svg>
</a>

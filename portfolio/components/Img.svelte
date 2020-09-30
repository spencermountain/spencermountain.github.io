<script>
  export let src = ''
  export let caption = ''
  export let link = ''
  export let href = ''
  link = link || href
  export let width = '100%'
</script>

<style>
  .container {
    text-align: right;
  }
  .caption {
    font-size: 0.9rem;
  }
  .link {
    text-decoration: none;
  }
</style>

<div class="container">
  {#if link}
    <a href={link} class="link" target="_blank">
      <img {src} alt={caption} style="width:{width}; margin-bottom:0px;" />
    </a>
  {:else}
    <img {src} alt={caption} style="width:{width}; margin-bottom:0px;" />
  {/if}
  <div class="caption">
    {@html caption}
  </div>
</div>

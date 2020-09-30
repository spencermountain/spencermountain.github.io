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
  .href {
    text-decoration: none;
  }
  video {
    max-width: 100%;
  }
</style>

<div class="container">
  {#if link}
    <a href={link} class="href" target="_blank">
      <video style="width:{width}; margin-bottom:0px;" {src} autoplay mute loop />
    </a>
  {:else}
    <video style="width:{width}; margin-bottom:0px;" {src} autoplay mute loop />
  {/if}
  <div class="caption">
    {@html caption}
  </div>
</div>

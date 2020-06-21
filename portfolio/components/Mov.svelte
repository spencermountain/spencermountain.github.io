<script>
  export let src = ''
  export let caption = ''
  export let link = ''
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
  video {
    max-width: 100%;
  }
</style>

<div class="container">
  {#if link}
    <a href={link} class="link" target="_blank">
      <video style="width:{width}; margin-bottom:0px;" {src} autoplay mute loop />
    </a>
  {:else}
    <video style="width:{width}; margin-bottom:0px;" {src} autoplay mute loop />
  {/if}
  <div class="caption">
    {@html caption}
  </div>
</div>

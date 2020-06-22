<script>
  export let video = ''
  export let color = 'steelblue'
  export let right = ''
  export let bottom = ''
  export let title = ''
  export let caption = ''
</script>

<style>
  .frame {
    border-radius: 5px;
    box-shadow: 2px 2px 8px 0px rgba(0, 0, 0, 0.2);
  }
  .right {
    text-align: right;
    line-height: 200%;
    font-size: 13px;
  }
  .mt2 {
    margin-top: 2rem;
  }
  .row {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
  .mb1 {
    margin-bottom: 1rem;
  }
  .gap {
    width: 100%;
  }
  .embed-container {
    position: relative;
    padding-bottom: 56.25%;
    height: 0;
    overflow: hidden;
    max-width: 100%;
  }
  .embed-container iframe,
  .embed-container object,
  .embed-container embed {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>

<div class="row">
  <div class="mb1" style="border-bottom: 3px solid {color};">{title}</div>
  <div class="mt2">
    <div class="right gap">
      {@html right}
    </div>
  </div>
</div>
<div class="gap embed-container">
  <iframe
    {title}
    class="frame"
    width="672"
    height="378"
    src="https://www.youtube-nocookie.com/embed/{video}"
    frameborder="0"
    allowfullscreen />
</div>
<div class="right gap">
  {@html bottom || caption}
</div>

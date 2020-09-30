<script>
  export let text = ''
  export let bottom = ''
</script>

<style>
  .container {
    margin-top: 5rem;
    margin-bottom: 5rem;
    width: 100%;
  }
  .text {
    margin-right: 30%;
    font-size: 60%;
    text-align: right;
    color: #735873;
  }
  .hr {
    color: lightgrey;
    width: 70%;
  }
</style>

<div class="container">
  <div class="text">{text}</div>
  <hr class="hr" />
  <div class="text">{bottom}</div>
</div>

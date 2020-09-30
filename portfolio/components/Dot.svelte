<script>
  export let project = ''
  let colors = {
    compromise: '#6699cc',
    wikipedia: '#50617A',
    freebase: '#6accb2',
    simple: '#e6b3bc'
  }
  let color = colors[project] || 'steelblue'
</script>

<style>
  .dot {
    margin-right: 15px;
    margin-top: 20px;
    height: 15px;
    width: 15px;
    border-radius: 20%;
    display: inline-block;
  }
</style>

<div class="dot" style="background-color:{color};" />

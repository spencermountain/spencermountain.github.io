const htm = require('htm')
const h = htm.bind(require('vhtml'))

const shrinkGrid = function() {
  return h`<div id="grid" class="row">
    <div
      class="h8 grow maxw10 rounded clip"
      style="
display:grid;
grid-template-columns: 0.618fr 1fr 0.618fr 1fr ;
grid-template-rows: 1fr 0.618fr 1fr;
"
    >
      <div class=" rounded" />
      <div
        class=" row2 hasImg"
        style='background-image: url("./assets/misc/boats.jpg");'
      />
      <div class=" bgpink" />
      <div class=" " />
      <div
        class=" col2 hasImg"
        style='background-image: url("./assets/misc/sea.jpg");'
      />
      <div class=" bgsky" />
      <div class=" " />
      <div class=" bgpink" />
      <div
        class=" bgpink hasImg"
        style='background-image: url("./assets/misc/orange.jpg");'
      />
      <div class=" bgrose" />
    </div>
  </div>`
}
module.exports = shrinkGrid

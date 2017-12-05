

function randomize(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr
}
//
const unicode = function() {
  let chars = `؍ͺ､꓾،„؈‚٭⸟׆∗יִײַ؞‎؛؀∘⌌∙∻⌍⋄⋅٭⋆ﻩ‎∼ͻ∽ر‎⸰·∾∿⋰፣҃҄҅΅'^῁῀ﺓ‎᾽῍῎`‘ه‎’‛꙾؎︒”‟⌎⌏⸇⸆⸁⸀΄ ҇῏῭΅ͺᵨᵩ؇`
  let arr = chars.split('')
  arr = arr.filter(c => c)
  arr = randomize(arr)
  // arr = randomize(arr)
  return arr.join('')
}
module.exports = unicode
console.log(unicode())

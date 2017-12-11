var purifycss = require("purify-css")
var content = ['./src/**/*.js'];
var css = ['./lib/tachyons.min.css'];

var options = {
  // Will write purified CSS to this file.
  output: './lib/purified.css',
  // Will minify CSS code in addition to purify.
  minify: true,

  // Logs out removed selectors.
  rejected: true
};

purifycss(content, css, options);

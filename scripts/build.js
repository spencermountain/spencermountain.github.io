
var exec = require('child_process').exec;
var babel = require("babel-core");
var fs = require("fs");

//browerify + uglify
exec('./node_modules/.bin/browserify -t uglifyify src/index.js -o ./builds/bundle.js')

babel.transformFile("./builds/bundle.js", {}, function(err, result) {
  fs.writeFileSync('./builds/bundle.es5.js', result.code) // => { code, map, ast }
  // require('./css')
  exec('uglifyjs ./builds/bundle.es5.js --compress --mangle -o ./builds/bundle.es5.js')
});

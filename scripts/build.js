
var exec = require('child_process').exec;

//browerify + uglify
exec('./node_modules/.bin/browserify -t uglifyify src/index.js -o ./builds/bundle.js')

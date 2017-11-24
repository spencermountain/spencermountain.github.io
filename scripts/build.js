
var exec = require('child_process').exec;

//browerify + uglify
exec('./node_modules/.bin/browserify src/index.js | ./node_modules/.bin/uglifyjs -c > ./builds/bundle.js')

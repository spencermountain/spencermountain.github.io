var budo = require('budo')
var exec = require('child_process').exec;

//watch /src and re-build
exec('watchify src/index.js -o builds/bundle.js')
// exec(`watchify src/index.js -o 'uglifyjs -cm > static/bundle.min.js'`)
exec('browser-sync start --server --files "./builds"')

//live-reload from ./builds
// budo('./builds/bundle.js', {
//   live: true, // setup live reload
//   port: 8080, // use this port
//   browserify: {
//     // transform: babelify   // ES6
//   }
// }).on('connect', function(ev) {
//   console.log('Server running on %s', ev.uri)
// }).on('update', function(buffer) {
//   console.log('bundle - %d bytes', buffer.length)
// })

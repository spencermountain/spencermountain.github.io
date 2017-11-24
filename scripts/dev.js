
var budo = require('budo')

var exec = require('child_process').exec;

//watch /src and re-build
exec('watchify src/index.js -o builds/bundle.js')

//live-reload from ./builds
budo('./builds/bundle.js', {
  live: true, // setup live reload
  port: 8080, // use this port
  browserify: {
    // transform: babelify   // ES6
  }
}).on('connect', function(ev) {
  console.log('Server running on %s', ev.uri)
  console.log('LiveReload running on port %s', ev.livePort)
}).on('update', function(buffer) {
  console.log('bundle - %d bytes', buffer.length)
})

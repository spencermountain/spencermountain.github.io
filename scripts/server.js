let connect = require('connect')
let statc = require('serve-static')
let server = connect()
const port = 5050

const startServer = function (abs) {
  console.log('running server')

  server.use(statc(abs))

  server.use(
    require('connect-livereload')({
      port: 35729,
    })
  )

  server.listen(port)
  console.log(`http://localhost:${port}`)

  let livereload = require('livereload')
  let lrserver = livereload.createServer()
  lrserver.watch(abs + '/**')
}
module.exports = startServer

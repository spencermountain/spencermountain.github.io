const sh = require('shelljs')
const post = process.argv[2] || ''

let cmd = `pug -w ./${post} -o ./${post}/build`
sh.exec(cmd)

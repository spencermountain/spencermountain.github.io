const sh = require('shelljs')
const post = process.argv[2] || ''
// npm install pug-cli -g
let cmd = `pug -w ./${post} -o ./${post}/build`
sh.exec(cmd)

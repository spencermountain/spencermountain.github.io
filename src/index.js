const redom = require('redom')
const el = redom.el
const mount = redom.mount

const hello = el('h1', 'hello, i built this');

mount(document.body, hello);

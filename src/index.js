const redom = require('redom')
const el = redom.el
const mount = redom.mount

const hello = el('h1', 'built with uglify!');

mount(document.body, hello);

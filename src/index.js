const el = require('redom').el;
const mount = require('redom').mount;
// require('web-animations-js/web-animations.min'); //polyfill

const Hello = require('./01-hello');
const Show = require('./02-show');
const Born = require('./03-born');
const Tree = require('./04-tree');
const Mistakes = require('./05-mistakes');
const Swim = require('./06-swim');
const Github = require('./07-github');
const Today = require('./08-today');
const Contact = require('./09-contact');

const css = {
  container: {
    display: 'flex',
    'flex-direction': 'column'
  }
};

class App {
  constructor() {
    this.el = el(
      '#app',
      {
        style: css.container
      },
      [
        new Hello(),
        new Show(),
        new Born(),
        new Tree(),
        new Mistakes(),
        new Swim(),
        new Github(),
        new Today(),
        new Contact(),
      ]
    );
  }
}

const app = new App();
mount(document.body, app);

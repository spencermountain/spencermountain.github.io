const el = require('redom').el;
const mount = require('redom').mount;
require('web-animations-js/web-animations.min'); //polyfill

const Born = require('./born');
const Internet = require('./internet');
const Mistakes = require('./mistakes');
const Github = require('./github');
const Today = require('./today');
const Tree = require('./tree');
const Hello = require('./hello');
const Show = require('./show/first');
const Swim = require('./show/swim');

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
        new Swim(),
        // new Internet(),
        new Mistakes(),
        new Github(),
        new Today(),
      ]
    );
  }
}

const app = new App();
mount(document.body, app);

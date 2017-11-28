const el = require('redom').el;
const mount = require('redom').mount;
require('web-animations-js/web-animations.min'); //polyfill

const Born = require('./born');
const Internet = require('./internet');
const Mistakes = require('./mistakes');
const Today = require('./today');

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
        new Born(),
        new Internet(),
        new Mistakes(),
        new Today(),
      ]
    );
  }
}

const app = new App();
mount(document.body, app);

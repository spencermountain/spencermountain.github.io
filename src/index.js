const el = require('redom').el;
const mount = require('redom').mount;
const styler = require('react-styling');
require('web-animations-js/web-animations.min'); //polyfill
const Baby = require('./01-baby');

const css = styler`
container:
	display: flex
	flex-direction:column
`;
class App {
  constructor() {
    this.el = el(
      '#app',
      {
        style: css.container
      },
      [new Baby(), new Baby()]
    );
  }
}

const app = new App();
mount(document.body, app);

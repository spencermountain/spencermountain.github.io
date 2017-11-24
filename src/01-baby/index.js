const el = require('redom').el;
const styler = require('react-styling');
const glamor = require('glamor');

const div = (a, b) => el('div', a, b);
const css = styler`
.container:
  // flex-basis: 50%;
  align-self: center;
  width:50%;
  margin: 20px
  border: 1px solid grey
  display:grid
  grid-template-columns:repeat(4, 1fr);
  grid-template-rows: 200px 200px;
  // align-items:center
  // justify-items:center
cell:
  border:1px solid lightsteelblue
  border-radius:10%;
  padding:10px
  &:hover
    background:red
main:
  grid-column-start: 1;
  grid-column-end: span 3;
  text-align:center
  grid-row: 1;
  border:1px solid grey;
`;
class Baby {
  constructor() {
    this.el = el(
      '#baby',
      {
        style: css.container
      },
      [
        el('', { style: css.main }, 'main'),
        el('', { style: css.cell }, 'cell'),
        el('', { style: css.cell }, 'cell'),
        el('', { style: css.cell }, 'cell'),
        el('', { style: css.cell }, [
          el('video', {
            style: { width: '100%' },
            src: './assets/vid/stairsTwo.mp4',
            playbackRate: 0.8,
            autoplay: true,
            loop: true,
            poster: null
          })
        ])
        // el('', { style: css.cell }, 'cell'),
        // el('', { style: css.cell }, 'cell'),
        // el('', { style: css.cell }, 'cell')
      ]
    );
  }
}

module.exports = Baby;

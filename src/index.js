import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import styler from 'react-styling'
import Thing from './thing'
import colors from './colors'
import './index.css'
import CNTower from "./cntower.svg"

const assets={
  // CNTower:require("./cntower.svg"),
  goto:require("../assets/goto.jpeg"),
  argmap:require("../assets/argmap.png"),
}
const style = styler`
  container
    text-align:center
    margin-left:100px
    margin-right:100px
    margin-top:50px

  top:
    display: flex;
    flex-wrap: nowrap;
    text-align:right
    height:275px
    left:
      flexGrow:3
    right:
      flexGrow:2
      img:
        height:275px
        border-radius:5px

  about:
    name:
      font-size:35px
      color:darkslategrey

  byline:
    text-align:left
    margin:10px
    marginLeft:25px

  cntower:
    height:120
  bio:
    position:relative
    border:1px solid red
    height:100px
    width:65%
    description:
      position:absolute
      left:10
      top:10
      color:grey

  projects:
    border:1px solid grey
    margin:20px
    marginTop:0px
    project:
      display: flex;
      flex-wrap: nowrap;
      min-height:150px
      circle:

  water:
    position:fixed
    bottom:0px
    height:20px
    width:100%
    display:block
    backgroundColor:steelblue
    margin:0
`
class App extends Component {
  constructor(props) {
    super(props);
    this.css = style
  }
  render() {
    let {css}=this
    return (
      <div>
        <div style={css.container}>

          <div style={css.top}>
            <div style={css.top.left}></div>
            <div style={css.top.right}>
              <img style={css.top.right.img} src={assets.goto}/>
            </div>
          </div>

          <div style={css.about}>
            <div style={css.about.name}>Ŝpeńcëѓ Қełƚy</div>
            <div style={css.about.description}>
              <div>
              {'freelance javascript developer'}
              <img style={css.about.cntower} src={CNTower}/>
              </div>
            </div>
            <Thing colors={colors[0]}/>
          </div>

          <div style={css.projects}>
            <div style={css.projects.project}>

            </div>
          </div>
        </div>
        <Thing colors={colors[1]}/>
        <div style={css.water}/>
      </div>
    );
  }
}


ReactDOM.render(
  <App />,
  document.getElementById('root')
);

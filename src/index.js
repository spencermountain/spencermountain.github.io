import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import styler from 'react-styling'
import Thing from './thing'
import colors from './colors'
import './index.css'

const assets={
  CNTower:require("./cntower.svg"),
  goto:require("../assets/goto9.png"),
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
    position:relative;
    greeting:
      position:absolute;
      font-size:11
      left:-50
      top:-55
      font-size:24
      color:dimgrey
      text-align:center
    name:
      font-size:35px
      color:darkslategrey
      margin:10px
      margin-bottom:5px
      marginLeft:25px
      text-align:left
    description:
      color:grey
      text-align:left
      margin-left:55
      z-index:1
      cntower:
        position:absolute
        z-index:4
        top:-20
        left:240
        height:90
    color:
      margin:10
      marginLeft:25
      height:10
      marginRight:15%

  projects:
    margin:8%
    marginTop:0px
    project:
      display: flex;
      flex-wrap: nowrap;
      min-height:200px
      side:
        border:1px solid grey
        flex-basis:75px
      about:
        border:1px solid grey
        flex-basis:400px
      img:
        border:1px solid grey
        flex-basis:400px

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
            <div style={css.about.greeting}>
              <div style={{fontSize:14}}>{'oh,'}</div>
              <div style={{fontSize:44, borderBottom:'1px solid lightsteelblue', margin:0}}>{'  hi'}</div>
            </div>
            <div style={css.about.name}>
              {'Sҏeƞceȓ Қellӯ'}
            </div>
            <div style={css.about.description}>
              <img src={assets.CNTower} style={css.about.description.cntower}/>
              {'freelance developer, toronto'}
            </div>
            <div style={css.about.color}>
              <Thing colors={colors[0]}/>
            </div>
          </div>
          <div style={css.projects}>
            <div style={css.projects.project}>
              <div style={css.projects.project.side}>
              </div>
              <div style={css.projects.project.about}>
              </div>
              <div style={css.projects.project.img}>
              </div>
            </div>

          </div>
        </div>
        <div style={css.water}/>
      </div>
    );
  }
}


ReactDOM.render(
  <App />,
  document.getElementById('root')
);

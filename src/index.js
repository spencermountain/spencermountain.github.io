import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import styler from 'react-styling'
import Youtube from './youtube'
import Thing from './thing'
import colors from './colors'
import './index.css'
import Github from 'react-icons/lib/io/social-github';
import Twitter from 'react-icons/lib/io/social-twitter';
import LinkedIn from 'react-icons/lib/io/social-linkedin-outline';
import Email from 'react-icons/lib/io/paper-airplane';

const assets={
  CNTower:require("./cntower.svg"),
  goto:require("../assets/goto9.png"),
  govdna:require("../assets/govdna.png"),
  argmap:require("../assets/argmap.png"),
  synset:require("../assets/synset.png"),
  rocking:require("../assets/rocking.png"),
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
      color:lightgrey
      opacity:0.2
      font-size:55
      text-align:center
      margin-top:50
      align-items: center;
      justify-content: center;
      table:
        font-size:35
        width:100%

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
    marginTop:45px
    project:
      display: flex;
      flex-wrap: nowrap;
      min-height:200px
      side:
        position:relative
        flex-basis:75px
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        circle:
          border-radius:50%
          width:17
          height:17
          border:3px solid steelblue
          background-color:linen
          z-index:3
        circleBottom:
          position:absolute
          width:3
          top:50%
          height:50%
          background-color:steelblue
        circleTop:
          position:absolute
          width:3
          top:0
          height:50%
          background-color:steelblue
      about:
        position:relative
        flex-basis:400px
        title:
          color:dimgrey
          font-size:18
          text-decoration:underline
          margin:15
          marginTop:40
          marginBottom:5
        description:
          color:silver
          marginLeft:25
        place:
          text-align:right
          font-size:15
          color:dimgrey
          text-decoration:underline
          position:absolute
          bottom:40
          margin:5
          right:25
      img:
        flex-basis:150px
  want:
    marginLeft:20%
    marginTop:25
    font-size:35
    color:darkslategrey
    subject:
      color:darkslategrey
      text-decoration:none
      border-bottom:3px dotted darkslategrey
      margin:5
      padding:0

  talk:
    height:100
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
    justify-content: space-around;
    margin:100
    marginTop:40
    way:
      title:
        display:block
        text-decoration:none
        color:darkslategrey



  spacer:
    height:150
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
    let project=css.projects.project
    return (
      <div>
        <div style={css.container}>

          <div style={css.top}>
            <div style={css.top.left}>
              <div>{'we gave the monkeys the bananas'}</div>
              <table style={css.top.left.table}>
                <tr>
                  <td>{'because they were hungry'}</td>
                  <td>{'because they were ripe'}</td>
                </tr>
              </table>
            </div>
            <div style={css.top.right}>
              <Youtube src={assets.goto} title={'Language as an Interface:  GOTO\'16'} href="https://www.youtube.com/watch?v=WuPVS2tCg8s"/>
            </div>
          </div>

          <div style={css.about}>
            <div style={css.about.greeting}>
              <div style={{fontSize:44, margin:0}}>{'hi,'}</div>
            </div>
            <div style={css.about.name}>
              {'Sҏeƞceȓ Қellӯ'}
            </div>
            <div style={css.about.description}>
              <img alt='cn tower' src={assets.CNTower} style={css.about.description.cntower}/>
              {'freelance developer, Toronto'}
            </div>
            <div style={css.about.color}>
              <Thing colors={colors[0]}/>
            </div>
          </div>
          <div style={css.projects}>

            <div style={project}>
              <div style={project.side}>
                <div style={project.side.circle}/>
                <div style={project.side.circleBottom}/>
              </div>
              <div style={project.about}>
                <div style={project.about.title}>
                  {'Natural Language Processing'}
                </div>
                <div style={project.about.description}>
                  {'rule-based NLP on the client-side'}
                </div>
                <a href="http://nlpcompromise.com/" style={project.about.place}>
                  {'open-source'}
                </a>
              </div>
              <div style={project.img}>
                <img alt={'nlp_compromise'} src={assets.rocking} style={{height:170}} />
              </div>
            </div>

            <div style={project}>
              <div style={project.side}>
                <div style={project.side.circleTop}/>
                <div style={project.side.circle}/>
                <div style={project.side.circleBottom}/>
              </div>
              <div style={project.about}>
                <div style={project.about.title}>
                  {'Interpolating economic assumption'}
                </div>
                <div style={project.about.description}>
                  {'Pension liability vizualization + interpretation'}
                </div>
                <a href="http://govinvest.com/" style={project.about.place}>
                  {'Govinvest.com'}
                </a>
              </div>
              <div style={project.img}>
                <img alt={'d3graphs'} src={assets.govdna} style={{height:170}} />
              </div>
            </div>

            <div style={project}>
              <div style={project.side}>
              <div style={project.side.circleTop}/>
                <div style={project.side.circle}/>
              </div>
              <div style={project.about}>
                <div style={project.about.title}>
                  {'Word-sense folksonomy'}
                </div>
                <div style={project.about.description}>
                  {'synonym understanding with statistical-ML and semantic web'}
                </div>
                <a href="http://state.com/" style={project.about.place}>
                  {'State.com'}
                </a>
              </div>
              <div style={project.img}>
                <img alt={'synset'} src={assets.synset} style={{height:170}} />
              </div>
            </div>
          </div>
        </div>

        <div style={css.want}>
          {'I am interested in '}
          <a href="" style={css.want.subject}>{'video, '}</a>
          <a href="" style={css.want.subject}>{'biology, '}</a>
          {'and '}
          <a href="" style={css.want.subject}>{'computer vision.'}</a>
          <div style={{marginLeft:45, marginTop:20}}>
            {'contact me '}
            <a href="" style={css.want.subject}>{'anytime.'}</a>
          </div>
        </div>

        <div style={css.talk}>
          <div style={css.talk.way}>
            <Github size={40}/>
            <a style={css.talk.way.title} href="">
              github
            </a>
          </div>
          <div style={css.talk.way}>
            <Twitter size={40}/>
            <a style={css.talk.way.title} href="">
              twitter
            </a>
          </div>
          <div style={css.talk.way}>
            <LinkedIn size={40}/>
            <a style={css.talk.way.title} href="">
              LinkedIn
            </a>
          </div>
        </div>

        <div style={css.spacer}/>
        <div style={css.water}/>
      </div>
    );
  }
}


ReactDOM.render(
  <App />,
  document.getElementById('root')
);

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import styler from 'react-styling'
import Youtube from './youtube'
import Thing from './thing'
import colors from './colors'
import './index.css'
import Github from 'react-icons/lib/io/social-github';
import Twitter from 'react-icons/lib/io/social-twitter';
import Wiki from 'react-icons/lib/io/android-globe';
import Email from 'react-icons/lib/io/paper-airplane';

const assets={
  CNTower:require("./cntower.svg"),
  goto:require("../assets/goto9.png"),
  govdna:require("../assets/govdna.png"),
  argmap:require("../assets/argmap.png"),
  synset:require("../assets/synset.png"),
  rocking:require("../assets/rocking.png"),
  earthbarely:require("../assets/earthbarely.gif"),
  ubiquity:require("../assets/ubiquity.png"),
  webby:require("../assets/webby.png"),
  unlockldn:require("../assets/unlockldn.png"),
  argmap:require("../assets/argmap_thumb.png"),
  treemap:require("../assets/treemap.gif"),
  wtf_wikipedia:require("../assets/wtf_wikipedia.svg"),
  kmstandards:require("../assets/kmstandards.png"),
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
      opacity:0.3
      font-size:55
      text-align:center
      margin-top:50
      align-items: center;
      justify-content: center;
      font-weight:500
      they:
        color:darkgrey
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
      color:darkslategrey
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
    text-align:center;
    justify-content: space-around;
    margin:100
    marginTop:40
    way:
      text-decoration:none
      color:darkslategrey
      title:
        display:block

  stuff:
    display: flex;
    padding:40
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    thing:
      position:relative
      text-align:center
      width:200
      height:250
      overflow:hidden
      margin:25
      border:1px solid lightgrey
      img:
        // height:250
      logo:
        position:relative
        height:75
        x-index:1
        top:50
        border-radius:5
      title:


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
                  <td>
                    {'because '}
                    <span style={css.top.left.they}>{'they'}</span>
                    {' were hungry'}
                  </td>
                  <td>
                    {'because '}
                    <span style={css.top.left.they}>{'they'}</span>
                    {' were ripe'}
                  </td>
                </tr>
              </table>
            </div>
            <div style={css.top.right}>
              <Youtube src={assets.goto} title={'Language as an Interface'} href="https://www.youtube.com/watch?v=WuPVS2tCg8s"/>
            </div>
          </div>

          <div style={css.about}>
            <div style={css.about.greeting}>
              <div style={{fontSize:34, margin:0}}>{'hi,'}</div>
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
                  {'Natural Language Understanding'}
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
                  {'Interpolating economic assumptions'}
                </div>
                <div style={project.about.description}>
                  {'Pension liability vizualization'}
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
                  {'homonym disambiguation from statistical-ML'}
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
            <a href="mailto:spencermountain@gmail.com" style={css.want.subject}>{'anytime.'}</a>
          </div>
        </div>

        <div style={css.talk}>
          <a style={css.talk.way} href="https://github.com/spencermountain">
            <Github size={40}/>
            <div style={css.talk.way.title} >
              github
            </div>
          </a>
          <a style={css.talk.way} href="https://twitter.com/spencermountain">
            <Twitter size={40}/>
            <div style={css.talk.way.title} >
              twitter
            </div>
          </a>
          <a style={css.talk.way} href="https://en.wikipedia.org/wiki/User:Spencerk">
            <Wiki size={40}/>
            <div style={css.talk.way.title} >
              wiki
            </div>
          </a>
        </div>

        <div style={css.stuff}>

          <div style={css.stuff.thing}>
            <img src={assets.earthbarely} style={css.stuff.thing.img}/>
            <div style={css.stuff.thing.title}>
              {'earthbarely'}
            </div>
          </div>

          <div style={css.stuff.thing}>
            <img src={assets.ubiquity} style={css.stuff.thing.img}/>
            <div style={css.stuff.thing.title}>
              {'Mozilla Ubiquity'}
            </div>
          </div>

          <div style={css.stuff.thing}>
            <img src={assets.webby} style={css.stuff.thing.logo}/>
            <div style={css.stuff.thing.title}>
              {'2015 Webby nomination'}
            </div>
            <a href="http://webbyawards.com/winners/2015/websites/general-website/community/state/">{'for best community'}</a>
          </div>

          <div style={css.stuff.thing}>
            <img src={assets.treemap} style={css.stuff.thing.img}/>
            <div style={css.stuff.thing.title}>
              <a href="http://cdn.rawgit.com/spencermountain/clooney/master/build/index.html">{'Famo.us alpha'}</a>
            </div>
          </div>

          <div style={css.stuff.thing}>
            <img src={assets.unlockldn} style={css.stuff.thing.img}/>
            <div style={css.stuff.thing.title}>
              {'Winner of UnlockLDN'}
            </div>
          </div>

          <div style={css.stuff.thing}>
            <img src={assets.kmstandards} style={css.stuff.thing.img}/>
            <div style={css.stuff.thing.title}>
              {'Legal contract analysis'}
            </div>
          </div>

          <div style={css.stuff.thing}>
            <img src={assets.wtf_wikipedia} style={css.stuff.thing.img}/>
            <div style={css.stuff.thing.title}>
              {'Wtf wikipedia'}
            </div>
          </div>

          <div style={css.stuff.thing}>
            <img src={assets.argmap} style={css.stuff.thing.img}/>
            <div style={css.stuff.thing.title}>
              {'Argument mapping'}
            </div>
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

import React, { Component } from 'react';
import Play from 'react-icons/lib/io/chevron-right';

  class Youtube extends Component {
    constructor(props) {
      super(props);
      this.css = {
        container:{
          position:'relative',
          height:275,
          width:440,
          borderRadius:'5px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border:'1px solid green'
        },
        image:{
          height:'100%',
          zIndex:1,
          position:'absolute'
        },
        play:{
          zIndex:4,
          fill:'darkgrey',
          opacity:1
        },
        title:{
          zIndex:4,
          color:'linen',
          opacity:0.8,
          fontSize:25,
        },
        title2:{
          position:'absolute',
          bottom:4,
          right:14,
          zIndex:4,
          fontSize:15,
          color:'linen',
        }
      }
    }
    render() {
      let {css, props}=this
      return (
        <a href={props.href} style={css.container}>
          <img alt={props.title} style={css.image} src={props.src}/>
          <div style={css.play}>
            <Play style={{opacity:0.9}} size={75} color="grey" />
          </div>
          <div style={css.title2}>
            {props.title}
          </div>

        </a>
      )
    }
  }
  module.exports = Youtube

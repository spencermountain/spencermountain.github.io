define (require, exports, module) ->
  Engine = require("famous/core/Engine")
  Transform = require("famous/core/Transform")
  Modifier = require("famous/core/Modifier")
  Surface = require("famous/core/Surface")
  Transitionable = require("famous/transitions/Transitionable")
  ContainerSurface = require("famous/surfaces/ContainerSurface")
  Easing = require("famous/transitions/Easing")
  mainContext = Engine.createContext()

  pipe = ->
    container= new ContainerSurface({
      size:[undefined, 150]
      })
    top = 20
    radian = 0.005
    pipe1 = new Surface(
      size: [`undefined`, 10]
      properties:
        backgroundColor: "lightgrey"
        border: "1px solid darkgrey"
        "border-right": "2px solid darkgrey"
        "border-radius": 4
        "border-top-right-radius": 4
        "border-bottom-right-radius": 4
    )
    rotate = new Modifier(
      origin: [0, 0]
      transform: Transform.rotateZ(radian)
    )
    move = new Modifier(transform: Transform.translate(-200, top, 0))
    container.add(move).add(rotate).add pipe1
    pipe2 = new Surface(
      size: [202, 10]
      properties:
        backgroundColor: "lightgrey"
        border: "1px solid darkgrey"
        "border-left": "2px solid darkgrey"
        "border-top-left-radius": 4
    )
    rotate = new Modifier(
      origin: [1, 0]
      transform: Transform.rotateZ(-radian)
    )
    move = new Modifier(transform: Transform.translate(2, top, 0))
    container.add(move).add(rotate).add pipe2
    tube = new Surface(
      size: [10, 14]
      properties:
        backgroundColor: "rgba(0,0,0,0)"
        "border-right": "5px solid darkgrey"
        "border-radius": "35%"

      content: "<div style=\"width:3px; position:relative; left:6px; top:-20px; height:20px; background-color:darkgrey;\"></div>"
    )
    move1 = new Modifier(
      origin: [0, 0]
      transform: Transform.translate(81, top, 0)
    )
    container.add(move1).add tube
    tube2 = new Surface(
      size: [10, 14]
      properties:
        backgroundColor: "rgba(0,0,0,0)"
        "border-right": "5px solid darkgrey"
        "border-radius": "35%"

      content: "<div style=\"width:3px; position:relative; left:6px; top:-20px; height:20px; background-color:darkgrey;\"></div>"
    )
    move2 = new Modifier(
      origin: [1, 0]
      transform: Transform.translate(-31, top - 2, 0)
    )
    container.add(move2).add tube2
    return container

  module.exports= pipe
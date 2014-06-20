define (require, exports, module) ->
  Engine = require("famous/core/Engine")
  Transform = require("famous/core/Transform")
  Modifier = require("famous/core/Modifier")
  Surface = require("famous/core/Surface")
  Transitionable = require("famous/transitions/Transitionable")
  ContainerSurface = require("famous/surfaces/ContainerSurface")
  Easing = require("famous/transitions/Easing")
  RenderNode = require("famous/core/RenderNode")
  mainContext = Engine.createContext()

  wave = ->
    r = parseInt(Math.random() * 28) - 14
    color = "rgb(" + (54 + r) + "," + (111 + r) + "," + (159 + r) + ")"
    surf = new Surface(
      size: [500, 100]
      properties:
        backgroundColor: color
        "border-radius": "2px"
    )
    duration = ->
      (Math.random() * 2200) + 1500

    make_radian = ->
      0.04 * Math.random()

    x = (Math.random() * 1000) - 500
    y = (Math.random() * 55)
    move = new Modifier(transform: Transform.translate(x, y, 0))
    rotate = new Modifier(
      origin: [0.5, 1.1]
      opacity: 0.75
      transform: Transform.rotateZ(make_radian() * ((Math.random() * 2) - .1))
    )
    node= new RenderNode()
    node.add(move).add(rotate).add surf

    rockout = (d) ->
      ease =
        duration: duration
        curve: Easing.inOutQuad

      ease.duration = duration()
      r = make_radian() * (2 * d)
      rotate.setTransform Transform.rotateZ(r), ease, ->
        rockout d * -1


    setTimeout (->
      d = Math.round(Math.random())
      rockout d
    ), Math.random() * 1500

    return node

  module.exports= wave
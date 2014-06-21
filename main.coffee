define (require, exports, module) ->
  Engine = require("famous/core/Engine")
  Transform = require("famous/core/Transform")
  Modifier = require("famous/core/Modifier")
  Surface = require("famous/core/Surface")
  Transitionable = require("famous/transitions/Transitionable")
  Easing = require("famous/transitions/Easing")
  ContainerSurface = require("famous/surfaces/ContainerSurface")
  Scrollview = require("famous/views/Scrollview")
  mainContext = Engine.createContext()
  pipe= require("./pipe")
  wave= require("./wave")

  w= window.innerWidth
  h= window.innerHeight
  if w<500
    w= 500
    if h<600
      h= 600
  container= new ContainerSurface({
    size:[w, h]
    })

  collins=->
    html= """
<pre style="word-wrap: break-word; white-space: pre-wrap; font-family: monospace;">
mike collins, from apollo 11-

I've had it with certain questions, and maybe the way they're asked.
But I've gotten slyer. I've gotten more adept at just deflecting them. I mean, if someone says, you know, "What was it like up there?"

You know, I've just written this fucking book telling em four hundred pages of what it was really like up there, and they say "Oh I loved your book! Now tell me: What was it really like up there?"
Well, I learned to deflect that. It depends on their age. I mean, if it's a young kid, you just say, "Oh it was cool, man" - they say, "Was it?". "Oh, shit, yeah. Oh, it was cool."

And they walk off. That's great. It's they want to hear the sound of their own voice, or they want to somehow interject with their own question or their own inquiry into the process. And that's alright. So I go by the age - I usually give em a one or two word answer, depending how old they are. And they usually - sometimes, though, they won't be satisfied with that, and they'll want to go on.

But nine times out of ten, they'll say, "Oh, oh, uh-huh" And they're very pleased.
</pre>
    """
    w= 450
    h= 540
    if window.innerWidth<w
      w= window.innerWidth - 20
    s= new Surface({
      size:[w, h]
      content:html
      })
    m= new Modifier({
     origin:[0.5, 0.5],
     # translate: Transform.translate(0, 250)
    })
    setTimeout ->
      container.add(m).add(s)
    ,4000
    return container

  make_song=->
    song = new Surface(
      size: [10, 14]
      properties:
        display: "inline"

      content: "<audio autoplay><source src=\"timescolonist.ogg\" type=\"audio/ogg\"></audio>"
    )
    setTimeout (->
      mainContext.add song
    ), 700

  container.add(pipe())

  wavepool= new ContainerSurface({
    size:[undefined, 250]
  })
  for i in [0..36]
     wavepool.add(wave())
  wm= new Modifier({
     origin:[0.5, 1.1],
     # translate: Transform.translate(0, 250)
  })
  container.add(wm).add(wavepool)

  collins()
  make_song()

  mainContext.add(container)

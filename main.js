define(function(require, exports, module) {

	var Engine = require('famous/core/Engine');
	var Transform = require('famous/core/Transform');
	var Modifier = require('famous/core/Modifier');
	var Surface = require('famous/core/Surface');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var mainContext = Engine.createContext();

	var wave = function() {
		var r = parseInt(Math.random() * 28) - 14
		var color = 'rgb(' + (54 + r) + ',' + (111 + r) + ',' + (159 + r) + ')'
		var surf = new Surface({
			size: [500, 100],
			properties: {
				backgroundColor: color,
				"border-radius": "2px",
			},
		});

		var duration = function() {
			return (Math.random() * 2200) + 1500
		}
		var make_radian = function() {
			return 0.04 * Math.random()
		}
		var make_opacity = function() {
			return (Math.random() / 4) + 0.60
		}

		var x = (Math.random() * 1000) - 500
		var y = (Math.random() * 55)
		var move = new Modifier({
			transform: Transform.translate(x, y, 0)
		});

		var rotate = new Modifier({
			origin: [0.5, 1.1],
			// opacity: make_opacity(),
			opacity: 0.75,
			transform: Transform.rotateZ(make_radian() * ((Math.random() * 2) - .1))
		});
		mainContext.add(move).add(rotate).add(surf)

		var rockout = function(d) {
			var ease = {
				duration: duration,
				curve: Easing.inOutQuad
			};
			ease.duration = duration()
			var r = make_radian() * (2 * d);
			rotate.setTransform(Transform.rotateZ(r), ease, function() {
				rockout(d * -1)
			});
		}

		setTimeout(function() {
			var d = Math.round(Math.random())
			rockout(d)
		}, Math.random() * 1500)

	}

	for (var i = 0; i < 35; i++) {
		wave()
	}


	function pipe() {

		var top = 20
		var radian = 0.005
		var pipe1 = new Surface({
			size: [undefined, 10],
			properties: {
				backgroundColor: 'lightgrey',
				"border": "1px solid darkgrey",
				"border-right": "2px solid darkgrey",
				"border-radius": 4,
				"border-top-right-radius": 4,
				"border-bottom-right-radius": 4
			}
		});
		var rotate = new Modifier({
			origin: [0, 0],
			transform: Transform.rotateZ(radian)
		});
		var move = new Modifier({
			transform: Transform.translate(-200, top, 0)
		});
		mainContext.add(move).add(rotate).add(pipe1)


		var pipe2 = new Surface({
			size: [202, 10],
			properties: {
				backgroundColor: 'lightgrey',
				"border": "1px solid darkgrey",
				"border-left": "2px solid darkgrey",
				"border-top-left-radius": 4
			}
		});
		var rotate = new Modifier({
			origin: [1, 0],
			transform: Transform.rotateZ(-radian)
		});
		var move = new Modifier({
			transform: Transform.translate(2, top, 0)
		});
		mainContext.add(move).add(rotate).add(pipe2)

		var tube = new Surface({
			size: [10, 14],
			properties: {
				backgroundColor: 'rgba(0,0,0,0)',
				"border-right": "5px solid darkgrey",
				"border-radius": "35%"
			},
			content: '<div style="width:3px; position:relative; left:6px; top:-20px; height:20px; background-color:darkgrey;"></div>'
		})
		var move1 = new Modifier({
			origin: [0, 0],
			transform: Transform.translate(81, top, 0)
		});
		mainContext.add(move1).add(tube)

		var tube2 = new Surface({
			size: [10, 14],
			properties: {
				backgroundColor: 'rgba(0,0,0,0)',
				"border-right": "5px solid darkgrey",
				"border-radius": "35%"
			},
			content: '<div style="width:3px; position:relative; left:6px; top:-20px; height:20px; background-color:darkgrey;"></div>'
		})
		var move2 = new Modifier({
			origin: [1, 0],
			transform: Transform.translate(-31, top - 2, 0)
		});
		mainContext.add(move2).add(tube2)

	}

	// pipe()


	var song = new Surface({
		size: [10, 14],
		properties: {
			display: 'inline',
		},
		content: '<audio autoplay><source src="timescolonist.ogg" type="audio/ogg"></audio>'
	})
	mainContext.add(song)


})
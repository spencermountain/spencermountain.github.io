var exec = require('child_process').exec;

//down-sample an image by a %
// exec('convert ./src/show/things/compost.png  -resize 30%  ./src/show/things/compost-small.png')

//down-sample a video by a %
// var file = '~/priv/portfolio/src/born/img/stairsTwo.mp4'
// exec(`ffmpeg -i ${file} -vf scale=360:202 output.mp4`)

//remove audio track
// exec(`ffmpeg -i output.mp4 -c copy -an output-nosound.mp4`)


// 960 × 540
// 480 x 270
// 360 x 202

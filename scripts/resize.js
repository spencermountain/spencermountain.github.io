var exec = require('child_process').exec;

//down-sample an image by a %
// exec('convert ./assets/img/carpet.jpg  -resize 50%  ./carpet-smaller.jpg')

//down-sample a video by a %
// var file = '~/priv/portfolio/src/born/img/stairsTwo.mp4'
// exec(`ffmpeg -i ${file} -vf scale=360:202 output.mp4`)

//remove audio track
// exec(`ffmpeg -i output.mp4 -c copy -an output-nosound.mp4`)


// 960 × 540
// 480 x 270
// 360 x 202

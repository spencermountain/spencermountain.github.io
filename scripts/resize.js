var exec = require('child_process').exec;

//down-sample an image by a %
exec('convert ./assets/img/carpet.jpg  -resize 50%  ./carpet-smaller.jpg')

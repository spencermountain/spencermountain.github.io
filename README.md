
## dev server
```
watchify ./src -> ./builds
budo ./builds
```

## build
```
browserify -t uglifyify ./src  -> ./builds
```

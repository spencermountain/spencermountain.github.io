var express = require("express"),
    app     = express.createServer();

app.get("/", function(req, res) {
  res.redirect("/home/index.html");
});

app.get("/couch", function(req, res) {
  res.redirect(":5984/_utils/");
});

app.configure(function(){
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/hosted'));
  app.use(express.errorHandler({
    dumpExceptions: false,
    showStack: true
  }));
  app.use(app.router);
});
var port=80;
app.listen(port);
console.log('http://localhost:'+port)
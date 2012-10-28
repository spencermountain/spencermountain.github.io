var follow=require("follow")
follow({db:"http://localhost:5984/spencermountain", include_docs:true}, function(error, change) {
  if(!error) {
  	console.log(change)
//    console.log("Change " + change.seq + " has " + Object.keys(change.doc).length + " fields");
  }
})
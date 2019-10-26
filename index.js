let express = require("express"),
    bodyParser = require("body-parser"),
    app = express(),
    urlencodedParser = bodyParser.urlencoded({ extended: false }),
    paswordValidator = require("password-validator"),
    schema = new paswordValidator(),
    url = 'mongodb://localhost:27017/',
    dbClient,
    pug = require("pug"),
    fs = require("fs"),
    path = require("path"),
    IterateObject = require("iterate-object");

const MongoClient = require("mongodb").MongoClient,
  jsonParser = express.json(),
  objectId = require("mongodb").ObjectID,
  mongoClient = new MongoClient(url, { useNewUrlParser: true });

schema
.is().min(8)
.is().max(16)
.has().uppercase()
.has().lowercase()
.has().digits()
.has().not().spaces()

app.set("view engine", "ejs");

app.set("view engine", "pug");

app.engine("html", require("ejs").renderFile);

app.use("/public", express.static("public"));

mongoClient.connect(function(err, client) {
  if(err) return console.log(err);
    dbClient = client;
    app.locals.collection = client.db("myblogcom").collection("users");
    app.listen(3000, function(){
        console.log("Сервер включен");
    });
})

app.get("/", function(req, res) {
  res.render("index.ejs")
})

app.get("/login", function(req, res) {
  res.render("login.ejs")
})

app.post("/login", urlencodedParser, function(req, res) {
  if(!req.body) return res.sendStatus(400);

  const collection = req.app.locals.collection;

  collection.findOne({email: req.body.email, password: req.body.pass}, function(err, doc) {
    if(doc == null){
      res.sendStatus(204);
    }else{
      fs.readFile("views/pugs/userpage.pug", "utf8", function(err, data) {
        if (err) throw err;

        let page = JSON.parse(fs.readFileSync("forpage.json", "utf8"));

        let fn = pug.compile(data, {inlineRuntimeFunctions: true})

        let html = fn({title: doc.username, message: doc._id});

        fs.writeFile("pages/page" + doc._id + ".html", html, "utf8")
        res.render("pages/page" + doc._id + ".html");
      })
      console.log(doc);
    }
  })
})

app.get("/registration", function(req, res) {
  res.render("registration.ejs")
})

app.post("/registration", urlencodedParser, function(req, res) {
  if(!req.body) return res.sendStatus(400);
  if(req.body.pass != req.body.pass2 || schema.validate(req.body.pass) == false && schema.validate(req.body.pass2) == false || req.body.user.length < 8 || req.body.email.length < 8){
    res.sendStatus(204)
  }else{

    let user = {
      email: req.body.email,
      username: req.body.user,
      password: req.body.pass
    }

    const collection = req.app.locals.collection;

    collection.insertOne(user);

    res.render("userinfo.ejs", {data: req.body});
    console.log(req.body)
  }
})

app.use((req, res) =>{
  res.status(404).render("404.ejs")
})

process.on("SIGINT", () => {
  console.log("Сервер выключен");
  dbClient.close();
  process.exit();
});

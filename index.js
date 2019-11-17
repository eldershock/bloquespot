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
    IterateObject = require("iterate-object"),
    multer = require("multer"),
    mkdirp = require("mkdirp"),
    cookieParser = require('cookie-parser'),
    postId = 0,
    pageUser;

let upload = multer({dest: "uploads/"});

const MongoClient = require("mongodb").MongoClient,
    jsonParser = express.json(),
    objectId = require("mongodb").ObjectID,
    mongoClient = new MongoClient(url, { useNewUrlParser: true }),
    ObjectId = require('mongodb').ObjectID;

const handleError = (err, res) => {
      res
        .status(500)
        .contentType("text/plain")
        .end("Oops! Something went wrong!");
    };

schema
.is().min(8)
.is().max(16)
.has().uppercase()
.has().lowercase()
.has().digits()
.has().not().spaces()

app.set("view engine", "ejs");

app.set("view engine", "pug");

app.use(cookieParser());

app.use("/public", express.static("public"));

mongoClient.connect(function(err, client) {
  if(err) return console.log(err);
    dbClient = client;
    app.locals.collection = client.db("myblogcom").collection("users");
    app.locals.collectionPictures = client.db("myblogcom").collection("pictures");
    app.locals.collectionPost = client.db("myblogcom").collection("articles");
    app.listen(3000, function(){
        console.log("Сервер включен");
    });
})

app.get("/", function(req, res) {

  const collection = req.app.locals.collection;

  if(req.cookies.username){
    collection.findOne({username: req.cookies.username}, function(err, doc) {
      let page = JSON.parse(fs.readFileSync("views/jsons/json" + doc._id + ".json", "utf8"));
      res.render("index.ejs", {username: page[0]["username"], logo: page[0]["logo"], url: page[0]["url"]})
    })
  }else{
    res.render("index.ejs", {username: ""})
  }
})

app.post("/", urlencodedParser, function(req, res) {
  res.clearCookie("username");
  res.clearCookie("currentLogo");
  res.redirect("/");
})

app.get("/login", function(req, res) {
  if(req.cookies.username){
    res.render("login.ejs", {username: req.cookies.username})
  }else{
    res.render("login.ejs", {username: ""})
  }
  console.log(req.cookies)
})

app.post("/login", urlencodedParser, function(req, res) {
  if(!req.body) return res.sendStatus(400);

  const collection = req.app.locals.collection;

  collection.findOne({email: req.body.email, password: req.body.pass}, function(err, doc) {
    if(doc == null){
      res.sendStatus(204);
    }else{

      fs.access("views/pages/page" + doc._id + ".ejs", fs.F_OK, (err) => {
        if (err) {
          fs.readFile("views/pugs/userpage.pug", "utf8", function(err, data) {
            if (err) throw err;

            let page = JSON.parse(fs.readFileSync("forpage.json", "utf8"));

            let fn = pug.compile(data, {inlineRuntimeFunctions: true})

            page[0]["name"] = doc.username;
            page[0]["url"] = "/user/" + doc._id;
            page[0]["logo"] = "https://cdn2.iconfinder.com/data/icons/ios-7-icons/50/user_male2-512.png";
            page[0]["id"] = doc._id;
            page[0]["localjson"] = "views/jsons/json" + doc._id + ".json"


            res.cookie("username", page[0]["name"]);
            res.cookie("currentLogo", page[0]["logo"]);


            let html = fn({title: "", username: "@" + "", vk: "", instgram: "", id: "", logo: "", subscribers: "", subscriptions: "", pathToJson: "", subscribe: page[0]["subscribe"]});

            let json = JSON.stringify(page, null, 2);

            fs.writeFileSync("views/pages/page" + page[0]["id"] + ".ejs", html, "utf8")
            fs.writeFileSync("views/jsons/json" + page[0]["id"] + ".json", json)
            collection.updateOne({email: req.body.email, password: req.body.pass}, {$set: {page: "pages/page" + page[0]["id"] + ".ejs", json: "jsons/json" + page[0]["id"] + ".json"}})
            res.redirect("/user/" + page[0]["id"]);
            console.log(page);
          })
        }else{
          let page = JSON.parse(fs.readFileSync("views/jsons/json" + doc._id + ".json", "utf8"));
          res.cookie("username", page[0]["name"]);
          res.cookie("currentLogo", page[0]["logo"])
          return res.redirect("/user/" + doc._id);
        }
      })
    }
    console.log(doc);
    console.log(req.cookies)
  })
})

app.get("/user/:id", function(req, res) {
  const collection = req.app.locals.collection;
  const collectionPost = req.app.locals.collectionPost;
  collection.findOne({_id: ObjectId(req.params.id)}, function(err, doc) {
    console.log(doc.page)
    pageUser = doc.page;
    fs.readFile("views/pugs/userpage.pug", "utf8", function(err, data) {
      if (err) throw err;
      let page = JSON.parse(fs.readFileSync("views/jsons/json" + doc._id + ".json", "utf8"));
      if(page[0]["postValue"] > 0){
        postId = page[0]["postValue"];
      }
      fs.access("views/jsons/post" + postId + ".json", fs.F_OK, (err) =>{
        if(err){
          res.render(pageUser, {title: page[0]["name"], username: "@" + page[0]["name"], vk: page[0]["vk"], instgram: page[0]["instagram"], id: page[0]["id"], logo: page[0]["logo"],
          subscribers: page[0]["subscribers"], subscriptions: page[0]["subscriptions"],
          pathToJson: page[0]["localjson"], url: page[0]["url"], currentUser: "@" + req.cookies.username,
          currentLogo: req.cookies.currentLogo});
        }else{
          collectionPost.find({forUser: req.params.id}).toArray(function(err, doc) {
            res.render(pageUser, {title: page[0]["name"], username: "@" + page[0]["name"], vk: page[0]["vk"], instgram: page[0]["instagram"], id: page[0]["id"], logo: page[0]["logo"],
            subscribers: page[0]["subscribers"], subscriptions: page[0]["subscriptions"],
            pathToJson: page[0]["localjson"], url: page[0]["url"], currentUser: "@" + req.cookies.username,
            currentLogo: req.cookies.currentLogo, posts: doc});
          })
         }
       })
      })
    })
  })

app.post("/user/:id", urlencodedParser, function(req, res) {

  const collection = req.app.locals.collection;

  collection.findOne({_id: ObjectId(req.params.id)}, function(err, doc) {

    fs.readFile("views/pugs/userpage.pug", "utf8", function(err, data) {
      let page = JSON.parse(fs.readFileSync("views/jsons/json" + doc._id + ".json", "utf8"));
      let fn = pug.compile(data, {inlineRuntimeFunctions: true})

      if(page[0]["subscribe"].indexOf(req.cookies.username) == -1){
        page[0]["subscribers"] = page[0]["subscribers"] + 1;
        page[0]["subscribe"].push(req.cookies.username)

        collection.findOne({username: req.cookies.username}, function(err, doc) {
          fs.readFile("views/pugs/userpage.pug", "utf8", function(err, data){
            let page = JSON.parse(fs.readFileSync("views/jsons/json" + doc._id + ".json", "utf8"));
            page[0]["subscriptions"] = page[0]["subscriptions"] + 1;
            let json = JSON.stringify(page, null, 2);
            let html = fn({title: "", username: "@" + "", vk: "", instgram: "", id: "", logo: "", subscribers: "", subscriptions: page[0]["subscriptions"], pathToJson: "", subscribe: "", postValue: page[0]["postValue"]});
            fs.writeFileSync("views/jsons/json" + page[0]["id"] + ".json", json);
            fs.writeFileSync("views/pages/page" + page[0]["id"] + ".ejs", html);
          })
        })

      }else{
        page[0]["subscribers"] = page[0]["subscribers"] - 1;

        page[0]["subscribe"].splice(page[0]["subscribe"].indexOf(req.cookies.username), 1)

        collection.findOne({username: req.cookies.username}, function(err, doc) {
          fs.readFile("views/pugs/userpage.pug", "utf8", function(err, data){
            let page = JSON.parse(fs.readFileSync("views/jsons/json" + doc._id + ".json", "utf8"));
            page[0]["subscriptions"] = page[0]["subscriptions"] - 1;
            let json = JSON.stringify(page, null, 2);
            let html = fn({title: "", username: "@" + "", vk: "", instgram: "", id: "", logo: "", subscribers: "", subscriptions: page[0]["subscriptions"], pathToJson: "", subscribe: "", postValue: page[0]["postValue"]});
            fs.writeFileSync("views/jsons/json" + page[0]["id"] + ".json", json);
            fs.writeFileSync("views/pages/page" + page[0]["id"] + ".ejs", html);
          })
        })

      }

      let json = JSON.stringify(page, null, 2);

      let html = fn({title: "", username: "@" + "", vk: "", instgram: "", id: "", logo: "", subscribers: "", subscriptions: "", pathToJson: "", subscribe: page[0]["subscribe"], postValue: page[0]["postValue"]});
      console.log(JSON.stringify(page[0]["subscribe"]))
      fs.writeFileSync("views/jsons/json" + doc._id + ".json", json);
      fs.writeFileSync("views/pages/page" + doc._id + ".ejs", html);
    })

  })

  res.sendStatus(204);
})

app.post("/user/addPost/:id", urlencodedParser, upload.array("addPicture", "addDocument", "addVideo"), function(req, res) {
  const collection = req.app.locals.collection;
  const collectionPost = req.app.locals.collectionPost;

  collection.findOne({_id: ObjectId(req.params.id)}, function(err, doc) {
    fs.readFile("views/pugs/userpage.pug", "utf8", function(err, data) {
      let page = JSON.parse(fs.readFileSync("views/jsons/json" + doc._id + ".json", "utf8"));
      let post = JSON.parse(fs.readFileSync("forpost.json", "utf8"));
      let fn = pug.compile(data, {inlineRuntimeFunctions: true});

      page[0]["postValue"] = page[0]["postValue"] + 1;
      post[0]["postId"] = postId + 1;
      post[0]["url"] = page[0]["url"]
      post[0]["logo"] = page[0]["logo"];
      post[0]["name"] = page[0]["name"];
      post[0]["postText"] = req.body.postText;
      let json = JSON.stringify(page, null, 2);

      let postJson = JSON.stringify(post, null, 2);

      let html = fn({postValue: page[0]["postValue"], subscribe: page[0]["subscribe"]});

      fs.readFile("views/pugs/post.pug", "utf8", function(err, data) {

        let page = JSON.parse(fs.readFileSync("views/jsons/json" + doc._id + ".json", "utf8"));
        let post = JSON.parse(fs.readFileSync("views/jsons/post" + postId + ".json", "utf8"));

        let postContents = {
          content: post[0]["postText"],
          postFile: "posts/post" + post[0]["postId"] + ".ejs",
          author: post[0]["name"],
          postId: post[0]["postId"],
          forUser: page[0]["id"]
        }

        let fn = pug.compile(data, {inlineRuntimeFunctions: true});

        let now = new Date();
        let month;

        if(now.getMonth() == 0){
          month = "января"
        }else if(now.getMonth() == 1){
          month = "февраля"
        }else if(now.getMonth() == 2){
          month = "марта"
        }else if(now.getMonth() == 3){
          month = "апреля"
        }else if(now.getMonth() == 4){
          month = "мая"
        }else if(now.getMonth() == 5){
          month = "июня"
        }else if(now.getMonth() == 6){
          month = "июля"
        }else if(now.getMonth() == 7){
          month = "августа"
        }else if(now.getMonth() == 8){
          month = "сентября"
        }else if(now.getMonth() == 9){
          month = "октября"
        }else if(now.getMonth() == 10){
          month = "ноября"
        }

        let postHtml = fn({postId: post[0]["postId"], postText: post[0]["postText"], url: page[0]["url"], logo: page[0]["logo"], username: page[0]["name"], dateHours: now.getHours(), dateMinutes: now.getMinutes(), dateDay: now.getDate(), dateMonth: month});
        fs.writeFileSync("views/pages/posts/post" + post[0]["postId"] + ".ejs", postHtml);
        collectionPost.insertOne(postContents);
      })

      fs.writeFileSync("views/jsons/json" + doc._id + ".json", json);
      fs.writeFileSync("views/pages/page" + doc._id + ".ejs", html);
      fs.writeFileSync("views/jsons/post" + post[0]["postId"] + ".json", postJson);
      postId = page[0]["postValue"];
    })
  })
  res.redirect("back");
})

app.get("/user/addPost/:id", function(req, res) {

})

app.post("/user/changeAva/:id", upload.single("avaPut"), function(req, res) {
  mkdirp("uploads/" + req.params.id, function(err) {
    const collection = req.app.locals.collection;
    const collectionPictures = req.app.locals.collectionPictures;
    const tempPath = req.file.path;
    let targetPath = path.join(__dirname, "uploads/" + req.params.id + "/ava.png")

    collection.findOne({_id: ObjectId(req.params.id)}, function(err, doc) {

        let page = JSON.parse(fs.readFileSync("views/jsons/json" + doc._id + ".json", "utf8"));

        if (path.extname(req.file.originalname).toLowerCase() === ".png" || path.extname(req.file.originalname).toLowerCase() === ".jpg"){
          fs.rename(tempPath, targetPath, err => {
            if (err) return handleError(err, res);

            page[0]["logo"] = req.url;

            let json = JSON.stringify(page, null, 2);

            fs.writeFileSync("views/jsons/json" + page[0]["id"] + ".json", json);
          });
        } else {
        fs.unlink(tempPath, err => {
            if (err) return handleError(err, res);
          });
        }
    })

    res.redirect("back");
  })

})

app.get("/user/changeAva/:id", function(req, res) {
  fs.readFile("uploads/" + req.params.id + "/ava.png", (err, image) => {
    res.end(image);
  });
  res.cookie("currentLogo", req.url);
})

app.get("/registration", function(req, res) {
  if(req.cookies){
    res.render("registration.ejs", {username: ""})
  }else{
    res.render("registration.ejs", {username: ""})
  }
})

app.post("/registration", urlencodedParser, function(req, res) {
  if(!req.body) return res.sendStatus(400);

  if(req.cookies.username){
    res.render("registration.ejs", {username: ""})
  }else{
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

      res.render("userinfo.ejs", {data: req.body, username: ""});
      console.log(req.body)
    }
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

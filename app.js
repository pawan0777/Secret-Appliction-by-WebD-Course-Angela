// order is important

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

// Required for cookies and session
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const { use } = require("passport");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ //Creating a session
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  }));
app.use(passport.initialize());
app.use(passport.session());


mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1:27017/userDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose); //useing passportLocalMongoose

const User = new mongoose.model("User", userSchema); //Created a new mongoose model

passport.use(User.createStrategy()); // Passport methods
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get('/secrets', function(req, res){
    User.find({'secret': {$ne: null}}, function(err, foundUsers){
        if(err){
            console.log(err);
        }else{
            if(foundUsers){
                res.render('secrets', {userWithSecrets: foundUsers});
            }
        }
    });
});

app.get('/submit', function(req, res){
    if(req.isAuthenticated()){ //check is user in authenticated or not
        res.render('submit');
    }else{
        res.redirect('/login');
    }
});

app.post('/submit', function(req, res){
    const submittedSecret = req.body.secret;
    User.findById(req.user.id, function(err, foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect('/secrets');
                });
            }
        }
    });
});

app.get('/logout', function(req, res){
    req.logOut(function(err){  //To go on the logout page
        if(err){
            console.log(err);
        }
        res.redirect('/');
    });
});

app.post("/register", function (req, res) {
    User.register({username: req.body.username}, req.body.password, function(err, user){  //Registering the user and save it to the database in mongodb
        if(err){
            console.log(err);
            res.redirect('/register');
        }else{
            passport.authenticate("local")(req, res, function(){  //Creating a salt and a hash for the password
                res.redirect('/secrets');
            });
        }
    });
});

app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err){  // Login the user
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect('/secrets');
            });
        }
    })
});

app.listen(3000, function () {
  console.log("Server started on port 3000.");
});

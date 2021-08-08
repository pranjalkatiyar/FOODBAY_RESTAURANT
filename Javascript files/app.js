require('dotenv').config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;



app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
// tell our app to use the session with passport
app.use(passport.session());



mongoose.connect("mongodb://localhost:27017/restaurantDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

//Schema is created

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    googleName:String,
    facebookId: String,
})

const checkoutSchema =new mongoose.Schema({
    firstname:String,
    lastname:String,
    userName:String,
    email:String,
    address:String,
    

})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)

const User = new mongoose.model("User", userSchema);
const Checkout=new mongoose.model("Checkout",checkoutSchema);

passport.use(User.createStrategy());


passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

//oauth

// google auth20 api passsport
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/inside",
    //taken form the google api docs
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function (accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({
        googleId: profile.id,
        googleName:profile.displayName
    }, function (err, user) {
        return cb(err, user);
    });
}
));

//facebook auth


// passport.use(new FacebookStrategy({
//     clientID: process.env.FACEBOOK_CLIENT_ID,
//     clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/facebook/index",
   
// },
// function (accessToken, refreshToken, profile, cb) {
//     console.log(profile);
//     User.findOrCreate({
//         facebookId: profile.id
//     }, function (err, user) {
//         return cb(err, user);
//     });
// }
// ));




//get


//homepage


//google passport get
app.get("/auth/google",
    passport.authenticate("google", {
        scope: ["profile"]
    })
);

app.get("/auth/google/inside",
    passport.authenticate('google', {
        failureRedirect: "/login"
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect("/inside");
    });
    
// //Facebook passport get
// app.get("/auth/facebook",
//     passport.authenticate('facebook',{
//         scope:["email"]
//     }));
// //callback url of the facebook
// app.get("/auth/facebook/secrets",
//     passport.authenticate('facebook', {
//         failureRedirect: "/login"
//     }),
//     function (req, res) {
//         // Successful authentication, redirect home.
      
//         res.redirect('/secrets');
//     });

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.get("/index", function (req, res) {
    res.redirect("/")
});

//login
app.get("/login", function (req, res) {
    res.sendFile(__dirname + "/login.html");
});

//register
app.get("/register", function (req, res) {
    res.sendFile(__dirname + "/register.html");
});

//checkout
app.get("/checkout",function(req,res){
    res.sendFile(__dirname+"/checkout.html");
});

//indsie
app.get("/inside",function(req,res){
    res.sendFile(__dirname+"/inside.html");
});



//post

app.post("/register", function (req, res) {
    User.register({
        username: req.body.username,
     }, req.body.password
    , function (err, user) {
        if (err) {
            console.log(err);
            req.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                console.log("registerd sucessfully");
            });

        }
    });
});


app.post("/login",function(req,res){
    const user =new User({
        username:req.body.username,password:req.body.password
    });
    req.login(user, function (err) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
               console.log("login sucessfully");
            });
        }
    });
});


app.post("/checkout",function(req,res){
    const checkoutdetails=new Checkout({
        firstname:req.body.FirstName,
        lastname:req.body.lastname,
        userName:req.body.userName,
        email:req.body.Email,
        address:req.body.Address,
    });
    checkoutdetails.save()
    .then(item => {
        console.log("Saved sucessfully");
        res.send("Information saved to database");
     }).catch(err => {
         console.log(err);
        res.status(400).send("Error! Unable to save to database. Email already used! Please go back and try again");
     });

});






















app.listen(3000, function (req, res) {
    console.log("Statred server 3000");
});
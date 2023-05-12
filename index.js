require("./utils.js");
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const saltRounds = 12;

const port = process.env.PORT || 3080;

const app = express();
const Joi = require("joi");
const expireTime = 1000 * 60 * 60 * 24; // expires after 24 hours

/* --- SECRETS --- */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;
/* ----- END ----- */

var { database } = include("databaseConnection");
 
const userCollection = database.db(mongodb_database).collection("users");

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));

var mongoStore = MongoStore.create({
  mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/bby14`,
  crypto: {
    secret: mongodb_session_secret,
  },
});

app.use(
  session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true,
  })
);

const { ObjectId } = require('mongodb');


function sessionValidation(req, res, next) {
  if (req.session.authenticated) {
    next();
  } else {
    res.render("index");
  }
}

function adminValidation(req, res, next) {
  if (req.session.user_type === "admin") {
    next();
  } else {
    res.status(403);
    res.render("403",{error: "Not Authorized"});
  }
}


// profile page setup
app.get("/profile", (req, res) => {
  const isEditing = (req.query.edit === 'true');
  if (!req.session.authenticated) {
    res.redirect('/login');
    return;

}
console.log(req.session);

  // res.render("profile",{name : req.session.name, email :req.session.email, birthday : req.session.birthday});
  res.render('profile', {
    name: req.session.name,
    email: req.session.email,
    birthday: req.session.birthday,
    _id:req.session._id,
    isEditing: isEditing
  });
})


// POST handler for the /profile route
app.post('/profile', async (req, res) => {
  // Update the user's profile information in the database using the submitted form data
  // const userCollection = db.collection('users');
  await userCollection.updateOne(
    { email: req.session.email },
    {
      $set: {
        name: req.body.name,
        
      }
    }
  );

  // Update the user's session with the new profile information
  req.session.name = req.body.name;
  // req.session.birthday = req.body.birthday;

  // Redirect the user back to the profile page, without the "edit" query parameter
  res.redirect('/profile');
});


app.use(express.static(__dirname + "/public"));
app.get("/", sessionValidation, (req, res) => {
  var name = req.session.name;
  res.render("index_user", { name: name });
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/submitUser", async (req, res) => {
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var birthday = req.body.birthday;

  console.log("birthday value:", birthday);

  /* Password match check - WIP - not working
  var confirmPassword = req.body.confirmPassword;

  if (password !== confirmPassword) {
    res.render("signup_error", { error: "Passwords do not match" });
    return;
  }
  */

  const schema = Joi.object({
    name: Joi.string().alphanum().max(20).required(),
    email: Joi.string().email().required(),
    password: Joi.string().max(20).required(),
    birthday: Joi.date().required(),
  }).options({ abortEarly: false }); // make it check all fields before returning

  const validationResult = schema.validate({ name, email, password, birthday });

  if (validationResult.error != null) {
    var errors = validationResult.error.details; // array of error objects from Joi validation
    var errorMessages = []; // array for error messages
    for (var i = 0; i < errors.length; i++) {
      errorMessages.push(errors[i].message);
    }
    var errorMessage = errorMessages.join(", ");
    res.render("signup_error", { error: errorMessage });
    return;
  }

  // check if email is already in use
  const result = await userCollection
    .find({ email: email })
    .project({ email: email })
    .toArray();

  if (result.length > 0) {
    res.render("signup_error", { error: "Email already in use (｡•́︿•̀｡)" });
    return;
  }

  // hash password
  var hashedPassword = await bcrypt.hash(password, saltRounds);

  // insert user into database
  await userCollection.insertOne({
    name: name,
    email: email,
    password: hashedPassword,
    birthday: birthday,
  });

  // successful signup - log in user and redirect to main page
  req.session.authenticated = true;
  req.session.name = name;
  req.session.email = email;
  req.session.birthday= birthday;
  res.redirect("/main");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/loggingin", async (req, res) => {
  var email = req.body.email;
  var password = req.body.password;

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().max(20).required(),
  }).options({ abortEarly: false });

  const validationResult = schema.validate({ email, password });

  if (validationResult.error != null) {
    var errors = validationResult.error.details;
    var errorMessages = [];
    for (var i = 0; i < errors.length; i++) {
      errorMessages.push(errors[i].message);
    }
    var errorMessage = errorMessages.join(", ");
    res.render("login-error", { error: errorMessage });
    return;
  }

  const result = await userCollection
    .find({ email: email })
    .project({ name: 1, email: 1, password: 1, _id: 1, user_type: 1,birthday: 1 })
    .toArray();

  if (result.length != 1) {
    res.render("login-error", { error: "User not found (｡•́︿•̀｡)" });
    return;
  }

  if (await bcrypt.compare(password, result[0].password)) {
    req.session.authenticated = true;
    req.session._id= result[0]._id;
    req.session.name = result[0].name;
    req.session.email = result[0].email;
    req.session.birthday = result[0].birthday;
    req.session.cookie.maxAge = expireTime;
    res.redirect("/loggedin");
    return;
  } else {
    res.render("login-error", { error: "Incorrect password (｡•́︿•̀｡)" });
    return;
  }
});

// Redirect to main page if user is logged in
app.get("/loggedin", sessionValidation, (req, res) => {
  res.redirect("/main");
});

// End session and redirect to login/signup page
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});


app.post('/users/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await userCollection.deleteOne({ _id:  new ObjectId(userId) });
    if (!user) {
      return res.status(404).send('User not found');
    }
    // optional: also delete any related data associated with the user
    // e.g. posts, comments, etc.
    // await Post.deleteMany({ author: userId });
    // await Comment.deleteMany({ author: userId });
    res.redirect('/signup');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});







app.get("*", (req, res) => {
  res.status(404);
  res.render("404");
})

app.listen(port, () => {
  console.log("Node application listening on port " + port);
}); 



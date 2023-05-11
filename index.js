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

const reportCollection = database.db(mongodb_database).collection("reports");

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
    .project({ name: 1, email: 1, password: 1, _id: 1, user_type: 1 })
    .toArray();

  if (result.length != 1) {
    res.render("login-error", { error: "User not found (｡•́︿•̀｡)" });
    return;
  }

  if (await bcrypt.compare(password, result[0].password)) {
    req.session.authenticated = true;
    req.session.name = result[0].name;
    req.session.email = email;
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

app.get("/createreport", sessionValidation, (req, res) => {
  res.render("createreport");
});

app.post("/submitreport", sessionValidation, async (req, res) => {

  let sleepScore = 100; // set the sleepScore to 100 at the beginning so that it resets back to 100 everytime a new report submits

  const userName = req.session.name;
  const email = req.session.email;
  const bedtimeHour = req.body.bedtimeHour;
  const bedtimeMinute = req.body.bedtimeMinute;
  const bedtimeAmPm = req.body.bedtimeAmPm;
  const wakeupHour = req.body.wakeupHour;
  const wakeupMinute = req.body.wakeupMinute;
  const wakeupAmPm = req.body.wakeupAmPm;
  const wakeupCount = req.body.wakeupcount;
  const alcohol = req.body.alcohol;
  
  let alcoholCount, wakeupCountInt;

  if (alcohol === "No") {
    alcoholCount = 0;
  } else if (req.body.alcohol === "10+ oz") {
    alcoholCount = 10;
  } else {
    alcoholCount = parseInt(req.body.alcoholcount);
  }
  
  if (wakeupCount === "10+ times") {
    wakeupCountInt = 10;
  } else {
    wakeupCountInt = parseInt(wakeupCount);
  }

  // Combine the bedtime hour, minute, and AM/PM into a single string in the format "8:30 AM"
  const bedtime = `${bedtimeHour}:${bedtimeMinute} ${bedtimeAmPm}`;

  // Combine the wakeup hour, minute, and AM/PM into a single string in the format "8:30 AM"
  const wakeup = `${wakeupHour}:${wakeupMinute} ${wakeupAmPm}`;

  // Calculate sleep score  NEEDS MORE WORK, JUST A DEMONSTRATION
  if (wakeupCountInt > 0) {
    sleepScore = sleepScore - 30;
  }

  // Create a new report object with the current date and time
  const currentDate = new Date();
  const options = { 
    year: 'numeric', 
    month: 'long',
    day: 'numeric',
    hour: 'numeric', 
    minute: 'numeric', 
    hour12: true 
  };
  const formattedDate = currentDate.toLocaleString('en-US', options);
  const report = {
    userName,
    email,
    bedtime,
    wakeup,
    wakeupCount: wakeupCountInt,
    alcohol,
    alcoholCount,
    sleepScore,
    date: formattedDate // use the formatted date and time
  };

  // Save the report to the database
  try {
    const result = await reportCollection.insertOne(report);
    console.log(`Inserted report with ID ${result.insertedId}`);
       // Redirect the user to the newreport route with the report data in the query parameters
       res.redirect(`/newreport?sleepScore=${sleepScore}&bedtime=${bedtime}&wakeup=${wakeup}&wakeupCount=${wakeupCount}&alcohol=${alcohol}&alcoholCount=${alcoholCount}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error submitting report');
  }
});

app.get('/newreport', sessionValidation, (req, res) => {
  const sleepScore = req.query.sleepScore;
  const bedtime = req.query.bedtime;
  const wakeup = req.query.wakeup;
  const wakeupCount = req.query.wakeupCount;
  const alcohol = req.query.alcohol;
  const alcoholCount = req.query.alcoholCount;

  // Render a new view with the report data
  res.render('newreport', { 
    sleepScore, 
    bedtime, 
    wakeup, 
    wakeupCount, 
    alcohol, 
    alcoholCount 
  });
});



app.get("/main", sessionValidation, (req, res) => {
  res.render("main", {
   
  }); // maybe want to use req.session.name
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/tips", sessionValidation, (req, res) => {
  res.render("tips");
});

//The route for public folder
app.use(express.static(__dirname + "/public"));

app.get("*", (req, res) => {
  res.status(404);
  res.render("404");
})

app.listen(port, () => {
  console.log("Node application listening on port " + port);
}); 
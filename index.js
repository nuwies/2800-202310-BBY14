require("./utils.js");
require("dotenv").config();

const uuid = require('uuid').v4;

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");

// SendGrid email service
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const saltRounds = 12;

const flash = require('connect-flash');

const port = process.env.PORT || 3080;

const app = express();

const Joi = require("joi");
const expireTime = 1000 * 60 * 60 * 24; // expires after 24 hours

const { ObjectId } = require('mongodb');

/* --- SECRETS --- */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;
/* ----- END ----- */

var { database } = include("databaseConnection");

const resetTokenCollection = database.db(mongodb_database).collection("resetTokens");

const userCollection = database.db(mongodb_database).collection("users");

const reportCollection = database.db(mongodb_database).collection("reports");
const reportProblem = database.db(mongodb_database).collection("reportProblem");
const analysisCollection = database.db(mongodb_database).collection("analysisCollection");


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

/* --- ADMIN VALIDATION --- 
function adminValidation(req, res, next) {
  if (req.session.user_type === "admin") {
    next();
  } else {
    res.status(403);
    res.render("403", { error: "Not Authorized" });
  }
}
 --------- END --------- */

app.use(flash());

// profile page setup
app.get("/profile", sessionValidation, (req, res) => {
  const isEditing = (req.query.edit === 'true');
  //   if (!req.session.authenticated) {
  //     res.redirect('/login');
  //     return;

  // }
  console.log(req.session);

  res.render('profile', {
    name: req.session.name,
    email: req.session.email,
    birthday: req.session.birthday,
    _id: req.session._id,
    isEditing: isEditing
  });
})

// POST handler for the /profile route
app.post('/profile', async (req, res) => {

  var name = req.body.name;
  var birthday = req.body.birthday;
  const schema = Joi.object({
    name: Joi.string().max(20).required(),

    birthday: Joi.date().required(),
  }).options({ abortEarly: false });


  const validationResult = schema.validate({ name, birthday });

  if (validationResult.error != null) {
    var errors = validationResult.error.details; // array of error objects from Joi validation
    var errorMessages = []; // array for error messages
    for (var i = 0; i < errors.length; i++) {
      errorMessages.push(errors[i].message);
    }
    var errorMessage = errorMessages.join(", ");
    res.render("profile_error", { error: errorMessage });
    return;
  }




  await userCollection.updateOne(
    { email: req.session.email },
    {
      $set: {
        name: req.body.name,

        birthday: req.body.birthday,


      }
    }
  );

  // Calculate the updated age
  const currentDate = new Date();
  const updatedBirthday = new Date(req.body.birthday);
  const updatedAge = currentDate.getFullYear() - updatedBirthday.getFullYear();

  // Update the age in the session
  req.session.age = updatedAge;

  req.session.name = req.body.name;

  req.session.birthday = req.body.birthday,

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
  var confirm_password = req.body.confirm_password;
  var birthday = req.body.birthday;

  const schema = Joi.object({
    name: Joi.string().alphanum().max(20).required(),
    email: Joi.string().email().required(),
    password: Joi.string().max(20).required(),
    confirm_password: Joi.string().max(20),
    birthday: Joi.date().required(),
  }).options({ abortEarly: false }); // check all fields before returning

// Calculate the age
const currentDate = new Date();
const birthdayDate = new Date(birthday);
const age = currentDate.getFullYear() - birthdayDate.getFullYear();


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

  // check if password matches confirm_password
  if (password !== confirm_password) {
    res.render("signup_error", { error: "Passwords do not match" }); // change to display error message under field later
    return;
  }

  // check if email is already in use
  const result = await userCollection
    .find({ email: email })
    .project({ email: email })
    .toArray();

  if (result.length > 0) {
    res.render("signup_error", { error: "Email already in use" });
    return;
  }

  const today = new Date();
  const minAge = 9;
  const minDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());

  // Parse the birthday input string into a Date object
  var birthday = new Date(req.body.birthday);

  // Validate the birthday
  if (isNaN(birthday.getTime()) || birthday > today) {
    res.render("signup_error", { error: "Invalid birthday" });
    return;
  }
  
  if (birthday > minDate) {
    res.render("signup_error", { error: "Invalid birthday" });
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
    token: "", // empty field for password reset token
  });


  // Store age in the session
  req.session.age = age;
  // successful signup - log in user and redirect to main page
  req.session.authenticated = true;
  req.session.name = name;
  req.session.email = email;
  req.session.birthday = birthday;
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
    .project({ name: 1, email: 1, password: 1, _id: 1, user_type: 1, birthday: 1 })
    .toArray();

  if (result.length != 1) {
    res.render("login-error", { error: "User not found" });
    return;
  }

  if (await bcrypt.compare(password, result[0].password)) {
    req.session.authenticated = true;
    req.session._id = result[0]._id;
    req.session.name = result[0].name;
    req.session.email = result[0].email;
    req.session.birthday = result[0].birthday;
    req.session.cookie.maxAge = expireTime;
    res.redirect("/loggedin");
    return;
  } else {
    res.render("login-error", { error: "Incorrect password" });
    return;
  }
});

app.get("/forgotpassword", (req, res) => {
  res.render("forgotpassword");
});

app.post("/sendresetemail", async (req, res) => {
  var email = req.body.email;

  // check if the email exists in the database
  const user = await userCollection.findOne({ email: email });
  if (user == null) {
    res.render("login-error", { error: "Email not found" });
    return;
  }

  const token = uuid().replace(/-/g, "");
  const resetLink = `https://panicky-lamb-kilt.cyclic.app/resetpassword?token=${token}`;

  // update the user's token in the database
  await resetTokenCollection.insertOne({
    token,
    userId: user._id,
    createdAt: new Date(),
  });

  // send email with the random number
  const msg = {
    to: email,
    from: "aisleep.bby14@gmail.com",
    templateId: "d-8165dda8d38d4a059e436d812148a15a",
    dynamicTemplateData: {
      subject: "AISleep Password Reset",
      resetLink: resetLink,
    },
  };

  try {
    await sgMail.send(msg);
    // res.status(200).send('Email sent');
    res.render("checkemail");
    return;
  }
  catch (error) {
    res.status(500).send("Error sending email");
  }
});

app.get("/resetpassword", async (req, res) => {
  // find user with matching decrypted token in the database
  const token = await resetTokenCollection.findOne({ token: req.query.token });

  if (token === null || new Date() - token.createdAt > (1000 * 60 * 15)) {
    res.render("login-error", { error: "Invalid or expired token" });
    return;
  }

  res.locals.token = token.token;
  res.render("resetpassword");
});

app.post("/resetpassword", async (req, res) => {
  const token = await resetTokenCollection.findOne({ token: req.body.token });
  const password = req.body.password;
  const confirm_password = req.body.confirm_password;

  if (token === null) {
    res.render("login-error", { error: "Invalid token" });
    return;
  }

  // check if password matches confirm_password
  if (password !== confirm_password) {
    res.render("reset-error", { error: "Passwords do not match", link: `/resetpassword?email=${email}&token=${token}` });
    return;
  }

  // hash password
  var hashedPassword = await bcrypt.hash(password, saltRounds);

  // update the user's password and token in the database
  await userCollection.updateOne(
    { _id: token.userId },
    { $set: { password: hashedPassword, token: "" } }
  );

  // remove token from resetTokenCollection
  await resetTokenCollection.deleteOne({ _id: token._id });

  res.redirect("/login");
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

app.get("/security", sessionValidation, (req, res) => {
  res.render("security", { messages: req.flash() });
});

app.post('/change-password', sessionValidation, async (req, res) => {
  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;
  const confirmNewPassword = req.body.confirmNewPassword;

  // Validate the input
  if (!currentPassword || !newPassword || !confirmNewPassword) {

    req.flash('error', 'All fields are required');
    return res.redirect('/security');
  }
  if (newPassword !== confirmNewPassword) {
    req.flash('error', 'New password and confirm password must match');
    return res.redirect('/security');
  }

  // Check if the current password is correct
  const email = req.session.email;
  const result = await userCollection
    .find({ email: email })
    .project({ name: 1, email: 1, password: 1, _id: 1, user_type: 1 })
    .toArray();
  if (!result) {
    req.flash('error', 'User not found');
    return res.redirect('/security');
  }
  const isMatch = await bcrypt.compare(currentPassword, result[0].password);
  if (!isMatch) {
    req.flash('error', 'Current password is incorrect');
    return res.redirect('/security');
  }

  // Update the password in the database
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await userCollection.updateOne({ email: email }, { $set: { password: hashedPassword } });
  req.flash('success', 'Password changed successfully!');
  return res.redirect('/security');

});


// deleting the user from the database.
app.post('/users/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await userCollection.deleteOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).send('User not found');
    }

    res.redirect('/signup');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.get("/createreport", sessionValidation, (req, res) => {
  res.render("createreport");
});

app.post("/submitreport", sessionValidation, async (req, res) => {

  const userName = req.session.name;
  const email = req.session.email;

  const bedtimeHour = req.body.bedtimeHour;
  const bedtimeMinute = req.body.bedtimeMinute;
  const bedtimeAmPm = req.body.bedtimeAmPm;

  const wakeupHour = req.body.wakeupHour;
  const wakeupMinute = req.body.wakeupMinute;
  const wakeupAmPm = req.body.wakeupAmPm;

  const takeTimeAsleepHour = req.body.takeTimeAsleepHour;
  const takeTimeAsleepMinute = req.body.takeTimeAsleepMinute;

  const wakeupCount = req.body.wakeupcount;

  const caffeine = req.body.caffeine;
  const alcohol = req.body.alcohol;
  const exercise = req.body.exercise;

  //convert to int
  const wakeupHourInt = parseInt(wakeupHour);
  const wakeupMinuteInt = parseInt(wakeupMinute);
  const bedtimeHourInt = parseInt(bedtimeHour);
  const bedtimeMinuteInt = parseInt(bedtimeMinute);

  let takeTimeAsleepHourInt;
  if (takeTimeAsleepHour === "5+ hrs") {
    takeTimeAsleepHourInt = 5;
  } else {
    takeTimeAsleepHourInt = parseInt(takeTimeAsleepHour);
  }
  let takeTimeAsleepMinuteInt = parseInt(takeTimeAsleepMinute);

  let wakeupCountInt;
  if (wakeupCount === "10+ times") {
    wakeupCountInt = 10;
  } else {
    wakeupCountInt = parseInt(wakeupCount);
  }

  let caffeineCount;
  if (caffeine === "No") {
    caffeineCount = 0;
  } else if (req.body.caffeine === "10+ mg") {
    caffeineCount = 10;
  } else {
    caffeineCount = parseInt(req.body.caffeinecount);
  }

  let alcoholCount;
  if (alcohol === "No") {
    alcoholCount = 0;
  } else if (req.body.alcohol === "10+ oz") {
    alcoholCount = 10;
  } else {
    alcoholCount = parseInt(req.body.alcoholcount);
  }

  let exerciseCount;
  if (exercise === "No") {
    exerciseCount = 0;
  } else {
    exerciseCount = parseInt(req.body.exercisecount);
  }

  // convert to string stored on database
  // Combine the bedtime hour, minute, and AM/PM into a single string in the format "8:30 AM"
  const bedtime = `${bedtimeHour}:${bedtimeMinute} ${bedtimeAmPm}`;
  // Combine the wakeup hour, minute, and AM/PM into a single string in the format "8:30 AM"
  const wakeup = `${wakeupHour}:${wakeupMinute} ${wakeupAmPm}`;
  //format "5+ hrs 40 min"
  const takeTimeAsleep = `${takeTimeAsleepHour} ${takeTimeAsleepMinute}`;

  const sleepDurationMin = calculateSleepDuration(bedtimeHourInt, bedtimeMinuteInt, bedtimeAmPm, wakeupHourInt, wakeupMinuteInt, wakeupAmPm);
  const sleepDuration = `${Math.floor(sleepDurationMin / 60)} hrs ${sleepDurationMin % 60} min`;

  const HoursAsleepMin = sleepDurationMin - (takeTimeAsleepHourInt * 60 + takeTimeAsleepMinuteInt);
  const HoursAsleep = `${Math.floor(HoursAsleepMin / 60)} hrs ${HoursAsleepMin % 60} min`;

  const sleepEfficiency = Math.round((HoursAsleepMin / sleepDurationMin) * 10000) / 100;

  function convertTo24HourFormat(hour, minute, amPm) {
    if (amPm === "PM" && hour < 12) {
      hour += 12;
    } else if (amPm === "AM" && hour === 12) {
      hour = 0;
    }
    return { hour, minute };
  }

  function calculateSleepDuration(bedtimeHourInt, bedtimeMinuteInt, bedtimeAmPm, wakeupHourInt, wakeupMinuteInt, wakeupAmPm) {
    // Convert bedtime to 24-hour format
    const bedtime = convertTo24HourFormat(bedtimeHourInt, bedtimeMinuteInt, bedtimeAmPm);

    // Convert wakeup time to 24-hour format
    const wakeup = convertTo24HourFormat(wakeupHourInt, wakeupMinuteInt, wakeupAmPm);

    // Calculate the time difference
    let sleepDurationMin = (wakeup.hour * 60 + wakeup.minute) - (bedtime.hour * 60 + bedtime.minute);

    // Subtract additional minutes
    if (sleepDurationMin < 0) {
      sleepDurationMin += 24 * 60; // Add 24 hours if the wakeup time is before the bedtime
    }

    return sleepDurationMin;
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
    takeTimeAsleep,
    sleepDuration, //
    HoursAsleep, //
    wakeupCount: wakeupCountInt,
    caffeine,
    caffeineCount,
    alcohol,
    alcoholCount,
    exercise,
    exerciseCount,
    // sleepScore,
    sleepEfficiency, //
    date: formattedDate, // use formatted date
    // tips: tipsString // add the tips array as a string
  };

  // Check the number of existing reports
  const reportCount = await reportCollection.countDocuments({ userName });
  console.log(`Report count: ${reportCount}`);
  // Set the maximum limit for reports
  const reportLimit = 10;

  if (reportCount >= reportLimit) {
    // If the limit is reached, you can handle it accordingly
    console.log('Report limit reached');
    return res.send("<script>alert('The report limit has reached 10! Please delete some reports in order to free up space.');window.location.href='/report_list'</script>");
  } else {
    // Save the report to the database
    try {
      const result = await reportCollection.insertOne(report);
      console.log(`Inserted report with ID ${result.insertedId}`);
      // Redirect the user to the newreport route with the report data in the query parameters, including the tips string

      // res.redirect(`/newreport?sleepScore=${sleepScore}&bedtime=${bedtime}&wakeup=${wakeup}&wakeupCount=${wakeupCount}&alcohol=${alcohol}&alcoholCount=${alcoholCount}&tips=${encodeURIComponent(tipsString)}&date=${encodeURIComponent(formattedDate)}`);
      res.redirect(`/newreport?bedtime=${bedtime}&wakeup=${wakeup}&takeTimeAsleep=${takeTimeAsleep}&sleepDuration=${sleepDuration}&HoursAsleep=${HoursAsleep}&wakeupCount=${wakeupCount}&caffeine=${caffeine}&caffeineCount=${caffeineCount}&alcohol=${alcohol}&alcoholCount=${alcoholCount}&exercise=${exercise}&exerciseCount=${exerciseCount}&sleepEfficiency=${sleepEfficiency}&date=${encodeURIComponent(formattedDate)}`);

    } catch (error) {
      console.error(error);
      res.status(500).send('Error submitting report');
    }
  };
});

app.get('/newreport', sessionValidation, (req, res) => {
  const date = req.query.date;
  // const sleepScore = req.query.sleepScore;
  const bedtime = req.query.bedtime;
  const wakeup = req.query.wakeup;
  const takeTimeAsleep = req.query.takeTimeAsleep;
  const sleepDuration = req.query.sleepDuration; //
  const HoursAsleep = req.query.HoursAsleep; //
  const wakeupCount = req.query.wakeupCount;
  const caffeine = req.query.caffeine;
  const caffeineCount = req.query.caffeineCount;
  const alcohol = req.query.alcohol;
  const alcoholCount = req.query.alcoholCount;
  const exercise = req.query.exercise;
  const exerciseCount = req.query.exerciseCount;
  // const tipsString = req.query.tips;
  const sleepEfficiency = req.query.sleepEfficiency; //

  // Split the tips string into an array of tips
  // const tips = tipsString.split(/\.|\?|!/);

  // Render a new view with the report data
  res.render('newreport', {
    // sleepScore, 
    bedtime,
    wakeup,
    takeTimeAsleep,
    sleepDuration,
    HoursAsleep,
    wakeupCount,
    caffeine,
    caffeineCount,
    alcohol,
    alcoholCount,
    exercise,
    exerciseCount,
    // tips,
    date,
    sleepEfficiency
  });
});

//display sleepEfficiency in main page
app.get("/main", sessionValidation, async (req, res) => {
  const name = req.session.name;

  const latestReport = await reportCollection.findOne({ userName: name }, { sort: { date: -1 } });
  console.log(latestReport);

  let sleepEfficiency = "NA";
  if (latestReport !== null) {
    const { sleepEfficiency: reportSleepEfficiency } = latestReport;
    if (reportSleepEfficiency !== null) {
      sleepEfficiency = reportSleepEfficiency;
    }
  }

  res.render("main", { name: name, sleepEfficiency: sleepEfficiency });
});

//for clicking on the button to see the latest report
app.post("/latestReport", sessionValidation, async (req, res) => {
  const name = req.session.name;
  const latestReport = await reportCollection.findOne({ userName: name }, { sort: { date: -1 } });
  console.log(latestReport);

  if (latestReport === null) {
    return res.send("<script>alert('You don\\'t have report! Let\\'s get your first report now!');window.location.href='/createreport'</script>");
  }

  const { bedtime, wakeup, takeTimeAsleep, sleepDuration, HoursAsleep, wakeupCount, caffeine, caffeineCount, alcohol, alcoholCount, exercise, exerciseCount, sleepEfficiency, date } = latestReport;

  // const tipsString = encodeURIComponent(tips);
  const formattedDate = encodeURIComponent(date);

  // res.redirect(`/newreport?sleepScore=${sleepScore}&bedtime=${bedtime}&wakeup=${wakeup}&wakeupCount=${wakeupCount}%20times&alcohol=${alcohol}&alcoholCount=${alcoholCount}&tips=${tipsString}&date=${formattedDate}`);
  res.redirect(`/newreport?bedtime=${bedtime}&wakeup=${wakeup}&takeTimeAsleep=${takeTimeAsleep}&sleepDuration=${sleepDuration}&HoursAsleep=${HoursAsleep}&wakeupCount=${wakeupCount}&caffeine=${caffeine}&caffeineCount=${caffeineCount}&alcohol=${alcohol}&alcoholCount=${alcoholCount}&exercise=${exercise}&exerciseCount=${exerciseCount}&sleepEfficiency=${sleepEfficiency}&date=${formattedDate}`);
});


app.get("/about", (req, res) => {
  res.render("about");
});


app.get("/facts", sessionValidation, (req, res) => {
  res.render("facts");
});

//read the tips data
app.get('/tips-data', sessionValidation, function (req, res) {
  const tipsData = require('./app/data/tips.json');
  res.json(tipsData);
});
//read the facts data
app.get('/facts-data', sessionValidation, function (req, res) {
  const factsData = require('./app/data/facts.json');
  res.json(factsData);
});

//get currentuser reports from mongodb
app.get('/report_list', sessionValidation, async (req, res) => {
  const name = req.session.name;
  const result = await reportCollection.find({ userName: name }).project({ userName: 1, date: 1, sleepEfficiency: 1, _id: 1 }).toArray();
  console.log(result);
  res.render("report_list", { reports: result });
});

//to see the specific report by doc id 
app.post('/report_list/:id', sessionValidation, async (req, res) => {
  const reportId = req.params.id;
  const report = await reportCollection.findOne({ _id: new ObjectId(reportId) }, {
    projection: {
      bedtime: 1,
      wakeup: 1,
      takeTimeAsleep: 1,
      sleepDuration: 1,
      HoursAsleep: 1,
      wakeupCount: 1,
      caffeine: 1,
      caffeineCount: 1,
      alcohol: 1,
      alcoholCount: 1,
      tips: 1,
      userName: 1,
      exercise: 1,
      exerciseCount: 1,
      sleepEfficiency: 1,
      date: 1,
      // sleepScore: 1
    }
  });
  console.log(report);

  const { bedtime, wakeup, takeTimeAsleep, sleepDuration, HoursAsleep, wakeupCount, caffeine, caffeineCount, alcohol, alcoholCount, exercise, exerciseCount, sleepEfficiency, date } = report;
  const formattedDate = encodeURIComponent(date);
  res.redirect(`/newreport?bedtime=${bedtime}&wakeup=${wakeup}&takeTimeAsleep=${takeTimeAsleep}&sleepDuration=${sleepDuration}&HoursAsleep=${HoursAsleep}&wakeupCount=${wakeupCount}&caffeine=${caffeine}&caffeineCount=${caffeineCount}&alcohol=${alcohol}&alcoholCount=${alcoholCount}&exercise=${exercise}&exerciseCount=${exerciseCount}&sleepEfficiency=${sleepEfficiency}&date=${formattedDate}`);
});

//delete report
app.post('/report_list/delete/:id', sessionValidation, async (req, res) => {
  const reportId = req.params.id;
  console.log(reportId);
  await reportCollection.deleteOne({ _id: new ObjectId(reportId) });
  res.redirect('/report_list');
});


app.get('/settings', sessionValidation, function (req, res) {
  res.render("settings", { name: req.session.name });
})

app.get('/preferences', sessionValidation, function (req, res) {
  res.render("preferences");
})

app.get("/problem", sessionValidation, (req, res) => {
  res.render("problem");
});

app.post('/reportProblem', sessionValidation, async (req, res) => {
  const name = req.session.name;
  const email = req.session.email;
  const problemText = req.body.problemText; // extract problem text from request body
  const date = new Date(); // get current date and time

  const schema = Joi.object({

    problemText: Joi.string().max(100).required(),
  }).options({ abortEarly: false });

  const validationResult = schema.validate({ problemText });

  if (validationResult.error != null) {
    var errors = validationResult.error.details;
    var errorMessages = [];
    for (var i = 0; i < errors.length; i++) {
      errorMessages.push(errors[i].message);
    }
    var errorMessage = errorMessages.join(", ");
    res.render("problem_error", { error: errorMessage });
    return;
  }

  const report = {
    problemText: problemText,
    date: date,
    name: name,
    email: email
  };

  try {
    const result = await reportProblem.insertOne(report);
    console.log(`Inserted problem reported ${result}`);

    res.send("<script>alert('Problem Reported succesfully');window.location.href='/problem'</script>")
  } catch (error) {
    console.error(error);
    res.status(500).send('Error submitting report');
  }
});

// Helper function to calculate average sleep efficiency
async function calculateSleepEfficiencyData(name) {
  const reports = await reportCollection
    .find({ userName: name })
    .project({ userName: 1, date: 1, sleepEfficiency: 1, _id: 0 })
    .sort({ date: 1 }) // Sort the reports in ascending order by date
    .toArray();

  return reports.map(report => ({ date: report.date, sleepEfficiency: report.sleepEfficiency }));
}

app.get("/stats", sessionValidation, async (req, res) => {
  const name = req.session.name;
  const sleepEfficiencyData = await calculateSleepEfficiencyData(name);
  const sleepEfficiencies = sleepEfficiencyData.map(data => data.sleepEfficiency);
  const dates = sleepEfficiencyData.map(data => data.date);
  const averageSleepEfficiency = sleepEfficiencies.reduce((acc, efficiency) => acc + efficiency, 0) / sleepEfficiencies.length;

  // Check if the user has set a sleep score goal
  let sleepEfficiencyGoal = req.session.sleepEfficiencyGoal;
  if (!sleepEfficiencyGoal) {
    sleepEfficiencyGoal = '';
  }

  res.render("stats", {
    name: name,
    averageSleepEfficiency: averageSleepEfficiency,
    sleepEfficiencyGoal: sleepEfficiencyGoal,
    updatedSleepEfficiencyGoal: req.query.sleepEfficiencyGoal, // Add the updated goal as a rendering variable
    sleepEfficiencies: JSON.stringify(sleepEfficiencies), // Pass sleepEfficiencies as a JSON string
    dates: JSON.stringify(dates) // Pass dates as a JSON string
  });
});

app.post("/updateGoal", sessionValidation, async (req, res) => {
  const name = req.session.name;
  let sleepEfficiencyGoal = req.body.goal; // Use "goal" instead of "sleepEfficiencyGoal"

  // Check if the input is a valid number between 0 and 100 inclusive
  if (sleepEfficiencyGoal !== '') {
    const sleepEfficiencyGoalNumber = parseInt(sleepEfficiencyGoal);
    if (!isNaN(sleepEfficiencyGoalNumber) && sleepEfficiencyGoalNumber >= 0 && sleepEfficiencyGoalNumber <= 100) {
      req.session.sleepEfficiencyGoal = sleepEfficiencyGoalNumber;
      res.redirect("/stats?sleepEfficiencyGoal=" + sleepEfficiencyGoalNumber); // Add the updated goal as a query parameter in the URL
      return; // Return early to prevent the subsequent res.render() call from executing
    }
  }

  // If the input is invalid or empty, set a default value for sleepEfficiencyGoal
  sleepEfficiencyGoal = req.session.sleepEfficiencyGoal || '';

  const sleepEfficiencyData = await calculateSleepEfficiencyData(name);
  const sleepEfficiencies = sleepEfficiencyData.map(data => data.sleepEfficiency);
  const dates = sleepEfficiencyData.map(data => data.date);

  const averageSleepEfficiency = sleepEfficiencies.reduce((acc, efficiency) => acc + efficiency, 0) / sleepEfficiencies.length;

  res.render("stats", {
    name: name,
    averageSleepEfficiency: averageSleepEfficiency,
    sleepEfficiencyGoal: sleepEfficiencyGoal,
    updatedSleepEfficiencyGoal: '', // Add the updated goal as a rendering variable with an empty value
    sleepEfficiencies: JSON.stringify(sleepEfficiencies), // Pass sleepEfficiencies as a JSON string
    dates: JSON.stringify(dates) // Pass dates as a JSON string
  });
});

//STORING DATA OF ANALYSIS IN MONGODB

const data = [
  {
    "age_range": "9-12",
    "Awakenings": -0.00,
    "Caffeine_consumption": 0.00,
    "Alcohol_consumption": 0.00,
    "Exercise_frequency": 0.00,
    "Intercept": 0.86,

  },
  {
    "age_range": "13-18",
    "Awakenings": 0.00,
    "Caffeine_consumption": 0.00,
    "Alcohol_consumption": 0.00,
    "Exercise_frequency": 0.06,
    "Intercept": 0.90,

  },
  {
    "age_range": "19-25",
    "Awakenings": -0.04,
    "Caffeine_consumption": 0.00,
    "Alcohol_consumption": -0.02,
    "Exercise_frequency": -0.01,
    "Intercept": 0.91,

  },
  {
    "age_range": "26-35",
    "Awakenings": -0.06,
    "Caffeine_consumption": -0.00,
    "Alcohol_consumption": -0.03,
    "Exercise_frequency": 0.00,
    "Intercept": 0.93,

  },
  {
    "age_range": "36-45",
    "Awakenings": -0.04,
    "Caffeine_consumption": 0.00,
    "Alcohol_consumption": -0.04,
    "Exercise_frequency": -0.00,
    "Intercept": 0.95,

  },
  {
    "age_range": "46-55",
    "Awakenings": -0.05,
    "Caffeine_consumption": 0.00,
    "Alcohol_consumption": -0.02,
    "Exercise_frequency": 0.01,
    "Intercept": 0.89,

  },
  {
    "age_range": "56-64",
    "Awakenings": -0.06,
    "Caffeine_consumption": -0.00,
    "Alcohol_consumption": -0.02,
    "Exercise_frequency": 0.01,
    "Intercept": 0.94,

  },
  {
    "age_range": "65+",
    "Awakenings": -0.05,
    "Caffeine_consumption": -0.00,
    "Alcohol_consumption": -0.02,
    "Exercise_frequency": 0.00,
    "Intercept": 0.96,

  }

]

async function updateData() {
  try {
    // Assuming you have established a connection to your MongoDB database

    // Define the update operation for each data object
    const updateOperations = data.map((obj) => ({
      updateOne: {
        filter: { age_range: obj.age_range },
        update: { $setOnInsert: obj },
        upsert: true,
      },
    }));

    // Perform the update operation
    await analysisCollection.bulkWrite(updateOperations, { ordered: false });

    console.log("Data inserted or updated successfully.");
  } catch (error) {
    console.error("Error inserting or updating data:", error);
  } finally {
    // Close the database connection or perform any cleanup tasks if necessary
  }
}

// Call the async function to update the data
updateData();

app.get('/calculateAge', sessionValidation, (req, res) => {
  const birthday = new Date(req.session.birthday);
  const currentDate = new Date();
  console.log('Birthday:', birthday);
  console.log('Current Date:', currentDate);
  if (isNaN(birthday)) {
    return res.status(400).send('Invalid birthday');
  }

  const age = currentDate.getFullYear() - birthday.getFullYear();

  // Display the age
  console.log("Age:", age);
  req.session.age = age;
  console.log(req.session.age);

  // Respond with the age
  res.send(`Age: ${age}`);
});

const factorsData = require('./app/data/facts.json');
app.post('/analysis', sessionValidation, async (req, res) => {
  const age = req.session.age.toString();
  const results = await analysisCollection
    .find({ $or: [{ age_range: { $regex: new RegExp(`^(\\d+)-`) } }, { age_range: { $eq: '65+' } }] })
    .project({ age_range: 1, Awakenings: 1, Caffeine_consumption: 1, Alcohol_consumption: 1, Exercise_frequency: 1, Intercept: 1 })
    .toArray();

  if (results.length === 0) {
    console.error('No matching age category found');
    return res.status(400).send('No matching age category found');
  }

  const matchingRange = results.find((result) => {
    if (result.age_range === '65+') {
      return age >= 65;
    } else {
      const [startAge, endAge] = result.age_range.split('-');
      return age >= parseInt(startAge) && age <= parseInt(endAge);
    }
  });

  if (!matchingRange) {
    console.error('No matching age range found');
    return res.status(400).send('No matching age range found');
  }

  console.log('Matching age range:', matchingRange);

  // Perform further analysis or calculations based on the matching range

  // Respond with the matching range
  const intercept = matchingRange.Intercept * 100;
  // from body
  const caffeineCount = req.body.caffeineCount;
  const WakeupCount = parseInt(req.body.wakeupCount);
  const alcoholCount = req.body.alcoholCount;
  const exerciseCount = req.body.exerciseCount;
  console.log(caffeineCount,WakeupCount,alcoholCount,exerciseCount);
  // Extract factor values from the MongoDB matching range
  const caffeineFromDB = matchingRange.Caffeine_consumption;
  const awakeningsFromDB = matchingRange.Awakenings;
  const alcoholFromDB = matchingRange.Alcohol_consumption;
  const exerciseFromDB = matchingRange.Exercise_frequency;

  // Calculate the products
  const caffeineProduct = caffeineCount * caffeineFromDB;
  const awakeningProduct = WakeupCount * awakeningsFromDB;
  const alcoholProduct = alcoholCount * alcoholFromDB;
  const exerciseProduct = exerciseCount * exerciseFromDB;


  // Determine which product is more negative
  let mostNegativeFactor;
  let factor;
  if (caffeineProduct <= awakeningProduct && caffeineProduct <= alcoholProduct && caffeineProduct <= exerciseProduct) {
    mostNegativeFactor = 'Caffeine';
    facts = factorsData.caffeine;
    factor = caffeineProduct;
  } else if (awakeningProduct <= caffeineProduct && awakeningProduct <= alcoholProduct && awakeningProduct <= exerciseProduct) {
    mostNegativeFactor = 'WakeupCount';
    facts = factorsData.awaking;
    factor = awakeningProduct;
  } else if (alcoholProduct <= caffeineProduct && alcoholProduct <= awakeningProduct && alcoholProduct <= exerciseProduct) {
    mostNegativeFactor = 'Alcohol';
    facts = factorsData.alcohol;
    factor = alcoholProduct;
  } else {
    mostNegativeFactor = 'Exercise';
    facts = factorsData.exercise;
    factor = exerciseProduct;
  }
const finalFactor = Math.abs(factor) * 100;


  console.log('Caffeine product:', caffeineProduct);
  console.log('Awakening product:', awakeningProduct);
  console.log('Alcohol product:', alcoholProduct);
  console.log('Exercise product:', exerciseProduct);
  console.log('Most negative factor:', mostNegativeFactor);
  console.log(caffeineCount);

// most negative factor from from database
let mostNegativeFactorFromDB;
let factorFromDB;

if (caffeineFromDB <= awakeningsFromDB && caffeineFromDB <= alcoholFromDB && caffeineFromDB <= exerciseFromDB) {
  mostNegativeFactorFromDB = 'Caffeine';
  factorFromDB = caffeineFromDB;
  facts = factorsData.caffeine;
} else if (awakeningsFromDB <= caffeineFromDB && awakeningsFromDB <= alcoholFromDB && awakeningsFromDB <= exerciseFromDB) {
  mostNegativeFactorFromDB = 'Awakenings';
  factorFromDB = awakeningsFromDB;
  facts = factorsData.awaking;
} else if (alcoholFromDB <= caffeineFromDB && alcoholFromDB <= awakeningsFromDB && alcoholFromDB <= exerciseFromDB) {
  mostNegativeFactorFromDB = 'Alcohol';
  factorFromDB = alcoholFromDB;
  factor = alcoholProduct;
} else {
  mostNegativeFactorFromDB = 'Exercise';
  factorFromDB = exerciseFromDB;
  facts = factorsData.exercise;
}

console.log('Most negative factor from db :', mostNegativeFactorFromDB);
  // Shuffle the facts array
const shuffledFacts = facts.sort(() => Math.random() - 0.5);

// Take the first two randomly picked facts
const relevantFacts = shuffledFacts.slice(0, 2).map((fact) => ({
  reason: fact.reason,
  explanation: fact.explanation,
}));
  

  const sleepEfficiency = req.body.sleepEfficiency;
  const difference = intercept - sleepEfficiency ;
  if (
    caffeineCount == 0 &&
    WakeupCount == 0 &&
    alcoholCount == 0 &&
    exerciseCount == 0 && sleepEfficiency < intercept
  ) {
    // Render a different page when all factor values are zero
    res.render("analysisThree", {
      Intercept: intercept,
      SleepEfficiency: sleepEfficiency,
      MostNegativeFactor: mostNegativeFactorFromDB,
      RelevantFacts: relevantFacts,
      Difference: difference
    });
  } 
 
 else  if (matchingRange.age_range === '9-12' && sleepEfficiency < intercept) {
   
    res.render("analysisOne", {
    
      Intercept: intercept,
      SleepEfficiency: sleepEfficiency,
      MostNegativeFactor: mostNegativeFactor,
      RelevantFacts: relevantFacts,
      Difference: difference
      
    });
  }else if(sleepEfficiency > intercept){
    res.render("analysisTwo", {
      Intercept: intercept,
      SleepEfficiency: sleepEfficiency,
      MostNegativeFactor: mostNegativeFactorFromDB,
      RelevantFacts: relevantFacts
    });
    

  }
   else {


    // Render the analysis template with the calculated sleep efficiency, intercept value, most negative factor, and relevant facts
    res.render("analysis", {
      Intercept: intercept,
      SleepEfficiency: sleepEfficiency,
      MostNegativeFactor: mostNegativeFactor,
      RelevantFacts: relevantFacts,
      Difference: difference,
      Factor :finalFactor
    });
  }
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

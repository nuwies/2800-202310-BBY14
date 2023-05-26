require("./utils.js");
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const Joi = require("joi");
const bcrypt = require("bcrypt");

const uuid = require('uuid').v4;
const methodOverride = require('method-override');
const flash = require('connect-flash');


// SendGrid email service
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const port = process.env.PORT || 3080;

const saltRounds = 12;

const expireTime = 1000 * 60 * 60 * 24; // 24 hours

const app = express();
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

const userCollection = database.db(mongodb_database).collection("users");
const reportCollection = database.db(mongodb_database).collection("reports");
const reportProblem = database.db(mongodb_database).collection("reportProblem");
const analysisCollection = database.db(mongodb_database).collection("analysisCollection");
const resetTokenCollection = database.db(mongodb_database).collection("resetTokens");
const goalCollection = database.db(mongodb_database).collection("goals");

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));

app.use(flash());

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

app.use(methodOverride('_method'));

app.use(express.static(__dirname + "/public"));

// Checks if the user is authenticated based on the session
function sessionValidation(req, res, next) {
  if (req.session.authenticated) {
    next();
  } else {
    res.render("index");
  }
}

// Render the "index_user" view with the user's name
app.get("/", sessionValidation, (req, res) => {
  var name = req.session.name;
  res.render("index_user", { name: name });
});

// Render the "signup" view for the "/signup" endpoint
app.get("/signup", (req, res) => {
  res.render("signup");
});

// Handle user sign up form submission and database insertion
app.post("/submitUser", async (req, res) => {
  var name = req.body.name.trim();
  var email = req.body.email.trim();
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

  const currentDate = new Date();
  const birthdayDate = new Date(birthday);
  const age = currentDate.getFullYear() - birthdayDate.getFullYear();

  const validationResult = schema.validate({ name, email, password, birthday });

  if (validationResult.error != null) {
    var errors = validationResult.error.details;
    var errorMessages = [];
    for (var i = 0; i < errors.length; i++) {
      errorMessages.push(errors[i].message);
    }
    var errorMessage = errorMessages.join(", ");
    res.render("signup_error", { error: errorMessage });
    return;
  }

  if (password !== confirm_password) {
    res.render("signup_error", { error: "Passwords do not match" });
    return;
  }

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
  const maxAge = 140;
  const minDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const maxDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());

  var birthdayNew = new Date(req.body.birthday);
  if (isNaN(birthdayNew.getTime()) || birthdayNew > today || birthdayNew < maxDate || birthdayNew > minDate) {
    res.render("signup_error", { error: "Invalid birthday" });
    return;
  }

  var hashedPassword = await bcrypt.hash(password, saltRounds);
  const insertResult = await userCollection.insertOne({
    name: name,
    email: email,
    password: hashedPassword,
    birthday: birthday,
    token: "", // Empty field reserved for password reset token
  });

  const userId = insertResult.insertedId.toString();
  req.session._id = userId;
  req.session.age = age;
  req.session.authenticated = true;
  req.session.name = name;
  req.session.email = email;
  req.session.birthday = birthday;
  res.redirect("/main");
});

// Render the "login" view for the "/login" endpoint
app.get("/login", (req, res) => {
  res.render("login");
});

// Handle user login form submission and authentication
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

// Render the "forgotpassword" view for the "/forgotpassword" endpoint
app.get("/forgotpassword", (req, res) => {
  res.render("forgotpassword");
});

// Handle password reset email submission, including token generation, database update, and email sending
app.post("/sendresetemail", async (req, res) => {
  var email = req.body.email;

  // Check if the email exists in the database
  const user = await userCollection.findOne({ email: email });
  if (user == null) {
    res.render("login-error", { error: "Email not found" });
    return;
  }

  // Update the user's reset token in the database
  const token = uuid().replace(/-/g, "");
  await resetTokenCollection.insertOne({
    token,
    userId: user._id,
    createdAt: new Date(),
  });

  // Send the password reset email
  const resetLink = `https://panicky-lamb-kilt.cyclic.app/resetpassword?token=${token}`;
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
    res.render("checkemail");
    return;
  }
  catch (error) {
    res.status(500).send("Error sending email");
  }
});

// Handle password reset page rendering, checking token validity and expiration
app.get("/resetpassword", async (req, res) => {
  const token = await resetTokenCollection.findOne({ token: req.query.token });

  if (token === null || new Date() - token.createdAt > (1000 * 60 * 15)) {
    res.render("login-error", { error: "Invalid or expired token" });
    return;
  }

  res.locals.token = token.token;
  res.render("resetpassword");
});

// Handle password reset form submission, validating token and updating password
app.post("/resetpassword", async (req, res) => {
  const token = await resetTokenCollection.findOne({ token: req.body.token });
  const password = req.body.password;
  const confirm_password = req.body.confirm_password;

  if (token === null) {
    res.render("login-error", { error: "Invalid token" });
    return;
  }
  if (password !== confirm_password) {
    res.render("reset-error", { error: "Passwords do not match", link: `/resetpassword?email=${email}&token=${token}` });
    return;
  }

  var hashedPassword = await bcrypt.hash(password, saltRounds);
  await userCollection.updateOne(
    { _id: token.userId },
    { $set: { password: hashedPassword, token: "" } }
  );
  await resetTokenCollection.deleteOne({ _id: token._id });

  res.redirect("/login");
});

// Redirect the user to the main page if logged in and session is validated
app.get("/loggedin", sessionValidation, (req, res) => {
  res.redirect("/main");
});

// Destroy the session and redirect the user to the home page
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// Renders the "profile" view with user profile information
app.get("/profile", sessionValidation, (req, res) => {
  const isEditing = (req.query.edit === 'true');

  res.render('profile', {
    name: req.session.name,
    email: req.session.email,
    birthday: req.session.birthday,
    _id: req.session._id,
    isEditing: isEditing
  });
})

// Route handler for the "/profile" POST endpoint
app.post("/profile", async (req, res) => {
  var name = req.body.name.trim();
  var birthday = req.body.birthday;
  const schema = Joi.object({
    name: Joi.string().alphanum().max(20).required(),
    birthday: Joi.date().required(),
  }).options({ abortEarly: false });

  const validationResult = schema.validate({ name, birthday });

  // Create an array of error messages
  if (validationResult.error != null) {
    var errors = validationResult.error.details;
    var errorMessages = [];
    for (var i = 0; i < errors.length; i++) {
      errorMessages.push(errors[i].message);
    }
    var errorMessage = errorMessages.join(", ");
    res.render("profile_error", { error: errorMessage });
    return;
  }

  const today = new Date();
  const minAge = 9;
  const maxAge = 140;
  const minDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const maxDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());

  var birthdayNew = new Date(req.body.birthday);
  if (
    isNaN(birthdayNew.getTime()) ||
    birthdayNew > today ||
    birthdayNew < maxDate ||
    birthdayNew > minDate
  ) {
    res.render("profile_error", { error: "Invalid birthday" });
    return;
  }

  await userCollection.updateOne(
    { email: req.session.email },
    { $set: { name: req.body.name, birthday: req.body.birthday } }
  );

  const currentDate = new Date();
  const updatedBirthday = new Date(req.body.birthday);
  const updatedAge = currentDate.getFullYear() - updatedBirthday.getFullYear();

  req.session.age = updatedAge;
  req.session.name = req.body.name.trim();
  req.session.birthday = req.body.birthday;

  res.redirect("/profile");
});


// Render the "security" template with flash messages for the authenticated user
app.get("/security", sessionValidation, (req, res) => {
  res.render("security", { messages: req.flash() });
});

app.post('/change-password', sessionValidation, async (req, res) => {
  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;
  const confirmNewPassword = req.body.confirmNewPassword;

  // Validate the password fields 
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    req.flash('error', 'All fields are required');
    return res.redirect('/security');
  }
  if (currentPassword === newPassword) {
    req.flash('error', 'Current password and New password must not match');
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

// Delete a user with the specified userId and redirect to the signup page after successful deletion
app.delete("/users/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const user = await userCollection.deleteOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).send("User not found");
    }
    req.session.destroy((error) => {
      if (error) {
        return res.status(500).send("Server error");
      }
      res.redirect("/signup");
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// Render the "createreport" page if a report for the current date does not exist, otherwise redirect to the report list page
app.get("/createreport", sessionValidation, async (req, res) => {
  const email = req.session.email;

  // Get today's date
  const today = new Date();
  const year = today.getFullYear();
  const month = today.toLocaleString('en-US', { month: 'long' });
  const day = today.getDate();

  // Format today's date as a string to match the stored format
  const formattedTodayString = `${month} ${day}, ${year}`;

  // Check if a report exists for the current date (ignoring time)
  const existingReport = await reportCollection.findOne({
    email: email,
    date: { $regex: `^${formattedTodayString}` }
  });

  if (existingReport) {
    // Report for today already exists
    res.send("<script>alert('A report already exists for today.'); window.location.href = '/report_list';</script>");
    return;
  } else {
    // No report exists for today
    res.render("createreport");
  }
});

var caffeineCount;
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

  if (caffeine === "No") {
    caffeineCount = 0;
    // } else if (req.body.caffeine === "10+ mg") {
    //   caffeineCount = 10;
    //store caffeinecount as 10 levels on mongoDB
  } else if (req.body.caffeinecount === "25 mg (1/3 cup)") {
    caffeineCount = 1;
  } else if (req.body.caffeinecount === "50 mg (2/3 cup)") {
    caffeineCount = 2;
  } else if (req.body.caffeinecount === "75 mg (1 cup)") {
    caffeineCount = 3;
  } else if (req.body.caffeinecount === "100 mg (1 1/3 cup)") {
    caffeineCount = 4;
  } else if (req.body.caffeinecount === "125 mg (1 2/3 cup)") {
    caffeineCount = 5;
  } else if (req.body.caffeinecount === "150 mg (2 cup)") {
    caffeineCount = 6;
  } else if (req.body.caffeinecount === "175 mg (2 1/3 cup)") {
    caffeineCount = 7;
  } else if (req.body.caffeinecount === "200 mg (2 2/3 cup)") {
    caffeineCount = 8;
  } else if (req.body.caffeinecount === "225 mg (3 cup)") {
    caffeineCount = 9;
  } else if (req.body.caffeinecount === "250+ mg (3 1/3+ cup)") {
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

  if (sleepDurationMin < 0 || HoursAsleepMin < 0 || HoursAsleepMin > sleepDurationMin) {
    return res.send('<script>alert("Invalid input."); window.location.href="/createreport";</script>');
  }

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
    let sleepDurationMin = 0;

    if (wakeup.hour > bedtime.hour || (wakeup.hour === bedtime.hour && wakeup.minute >= bedtime.minute)) {
      // The wakeup time is after the bedtime on the same day
      sleepDurationMin = (wakeup.hour * 60 + wakeup.minute) - (bedtime.hour * 60 + bedtime.minute);
    } else {
      // The wakeup time is before the bedtime, so it's on the next day
      sleepDurationMin = (wakeup.hour * 60 + wakeup.minute) + (24 * 60) - (bedtime.hour * 60 + bedtime.minute);
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
  const reportLimit = 7;

  if (reportCount >= reportLimit) {
    // If the limit is reached, you can handle it accordingly
    console.log('Report limit reached');
    return res.send("<script>alert('The report limit has reached the max amount of 7 reports! Please delete some reports in order to free up space.');window.location.href='/report_list'</script>");
  } else {
    // Save the report to the database
    try {
      const result = await reportCollection.insertOne(report);
      console.log(`Inserted report with ID ${result.insertedId}`);

      //convert back for displaying on page
      convertToCaffeineOption(caffeineCount);

      // Redirect the user to the newreport route with the report data in the query parameters, including the tips string
      res.redirect(`/newreport?bedtime=${bedtime}&wakeup=${wakeup}&takeTimeAsleep=${takeTimeAsleep}&sleepDuration=${sleepDuration}&HoursAsleep=${HoursAsleep}&wakeupCount=${wakeupCount}&caffeine=${caffeine}&caffeineCount=${caffeineOption}&alcohol=${alcohol}&alcoholCount=${alcoholCount}&exercise=${exercise}&exerciseCount=${exerciseCount}&sleepEfficiency=${sleepEfficiency}&date=${encodeURIComponent(formattedDate)}`);

    } catch (error) {
      console.error(error);
      res.status(500).send('Error submitting report');
    }
  };
});

// Render the newreport view with the report data
app.get('/newreport', sessionValidation, (req, res) => {
  const date = req.query.date;
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
  const sleepEfficiency = req.query.sleepEfficiency; //

  // Render a new view with the report data
  res.render('newreport', {
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
    date,
    sleepEfficiency
  });
});

// Render the main view with the user's name and their latest sleep efficiency value
app.get("/main", sessionValidation, async (req, res) => {
  const name = req.session.name;
  const latestReport = await reportCollection.findOne(
    { userName: name },
    { sort: { date: -1 } }
  );

  let sleepEfficiency = "NA";
  if (latestReport !== null) {
    const { sleepEfficiency: reportSleepEfficiency } = latestReport;
    if (reportSleepEfficiency !== null) {
      sleepEfficiency = reportSleepEfficiency;
    }
  }
  res.render("main", { name: name, sleepEfficiency: sleepEfficiency });
});

// Render the report_list view with the user's name and all of their reports
app.post("/latestReport", sessionValidation, async (req, res) => {
  const name = req.session.name;
  const latestReport = await reportCollection.findOne({ userName: name }, { sort: { date: -1 } });

  if (latestReport === null) {
    return res.send("<script>alert('You don\\'t have any reports! Let\\'s get your first report now!');window.location.href='/createreport'</script>");
  }

  const { bedtime, wakeup, takeTimeAsleep, sleepDuration, HoursAsleep, wakeupCount, caffeine, caffeineCount, alcohol, alcoholCount, exercise, exerciseCount, sleepEfficiency, date } = latestReport;
  const formattedDate = encodeURIComponent(date);

  convertToCaffeineOption(caffeineCount);

  res.redirect(`/newreport?bedtime=${bedtime}&wakeup=${wakeup}&takeTimeAsleep=${takeTimeAsleep}&sleepDuration=${sleepDuration}&HoursAsleep=${HoursAsleep}&wakeupCount=${wakeupCount}&caffeine=${caffeine}&caffeineCount=${caffeineOption}&alcohol=${alcohol}&alcoholCount=${alcoholCount}&exercise=${exercise}&exerciseCount=${exerciseCount}&sleepEfficiency=${sleepEfficiency}&date=${formattedDate}`);
});

// Render the "about" view template to display information about the app
app.get("/about", (req, res) => {
  res.render("about");
});

// Redirect the user to the easter egg after 3 clicks
let clickCount = 0;
app.post("/about", (req, res) => {
  clickCount++;
  if (clickCount === 3) {
    clickCount = 0;
    return res.send("<script>alert('Would you like to see something interesting?'); window.location.href='/easter_egg'</script>");
  }
  else {
    return res.redirect("/about");
  }
});

// Render the "easter_egg" view template for displaying a puzzle
app.get("/easter_egg", (req, res) => {
  res.render("easter_egg");
});

// Render the "facts" view template for displaying information about sleep
app.get("/facts", sessionValidation, (req, res) => {
  res.render("facts");
});

// Read the tips data
app.get('/tips-data', sessionValidation, function (req, res) {
  const tipsData = require('./app/data/tips.json');
  res.json(tipsData);
});

// Read the facts data
app.get('/facts-data', sessionValidation, function (req, res) {
  const factsData = require('./app/data/facts.json');
  res.json(factsData);
});

// Get the current user's reports from mongodb
app.get('/report_list', sessionValidation, async (req, res) => {
  const name = req.session.name;
  const result = await reportCollection.find({ userName: name }).project({ userName: 1, date: 1, sleepEfficiency: 1, _id: 1 }).toArray();
  console.log(result);
  res.render("report_list", { reports: result });
});

// View a specific report by id
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
    }
  });
  const { bedtime, wakeup, takeTimeAsleep, sleepDuration, HoursAsleep, wakeupCount, caffeine, caffeineCount, alcohol, alcoholCount, exercise, exerciseCount, sleepEfficiency, date } = report;
  const formattedDate = encodeURIComponent(date);

  convertToCaffeineOption(caffeineCount);

  res.redirect(`/newreport?bedtime=${bedtime}&wakeup=${wakeup}&takeTimeAsleep=${takeTimeAsleep}&sleepDuration=${sleepDuration}&HoursAsleep=${HoursAsleep}&wakeupCount=${wakeupCount}&caffeine=${caffeine}&caffeineCount=${caffeineOption}&alcohol=${alcohol}&alcoholCount=${alcoholCount}&exercise=${exercise}&exerciseCount=${exerciseCount}&sleepEfficiency=${sleepEfficiency}&date=${formattedDate}`);
});

// Convert the caffeine count to a user-friendly option
let caffeineOption;
function convertToCaffeineOption(caffeineCount) {
  switch (caffeineCount) {
    case 0:
      caffeineOption = 0;
      break;
    case 1:
      caffeineOption = "25 mg (1/3 cup)";
      break;
    case 2:
      caffeineOption = "50 mg (2/3 cup)";
      break;
    case 3:
      caffeineOption = "75 mg (1 cup)";
      break;
    case 4:
      caffeineOption = "100 mg (1 1/3 cup)";
      break;
    case 5:
      caffeineOption = "125 mg (1 2/3 cup)";
      break;
    case 6:
      caffeineOption = "150 mg (2 cup)";
      break;
    case 7:
      caffeineOption = "175 mg (2 1/3 cup)";
      break;
    case 8:
      caffeineOption = "200 mg (2 2/3 cup)";
      break;
    case 9:
      caffeineOption = "225 mg (3 cup)";
      break;
    case 10:
      caffeineOption = "250+ mg (3 1/3+ cup)";
      break;
    default:
      caffeineOption = 0; // Default to "No" if the input is not within the expected range
      break;
  }
}

// Delete a specific report by id
app.post('/report_list/delete/:id', sessionValidation, async (req, res) => {
  const reportId = req.params.id;
  if (reportId === 'all') {
    // Handle the case of deleting all reports
    const name = req.session.name;
    await reportCollection.deleteMany({ userName: name });
  } else {
    // Handle the case of deleting a specific report
    await reportCollection.deleteOne({ _id: new ObjectId(reportId) });
  }
  res.redirect('/report_list');
});

// Delete all reports
app.post('/report_list/delete/all', sessionValidation, async (req, res) => {
  const name = req.session.name;
  await reportCollection.deleteMany({ userName: name });
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
  const problemText = req.body.problemText.trim();
  const date = new Date();

  const schema = Joi.object({
    problemText: Joi.string().max(300).required(),
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
    res.send("<script>alert('Problem reported succesfully.');window.location.href='/problem'</script>")
  } catch (error) {
    console.error(error);
    res.status(500).send('Error submitting report!');
  }
});

// Helper function to calculate average sleep efficiency
async function calculateSleepEfficiencyData(name) {
  const reports = await reportCollection
    .find({ userName: name })
    .project({ userName: 1, date: 1, sleepEfficiency: 1, _id: 0 })
    .sort({ date: 1 }) // Sort the reports in ascending order by date
    .toArray();
  return reports.map((report) => ({ date: report.date, sleepEfficiency: report.sleepEfficiency }));
}

// Helper function to provide a status for the goal
function calculateGoalStatus(targetDate, sleepEfficiencyGoal, averageSleepEfficiency) {
  const currentDate = new Date();
  averageSleepEfficiency = Math.round(averageSleepEfficiency);

  if (!targetDate || targetDate === "") {
    return "No goal set. Set a sleep efficiency goal to track your progress!";
  } else if (currentDate > new Date(targetDate)) {
    if (averageSleepEfficiency >= sleepEfficiencyGoal) {
      return "Congratulations! You achieved your sleep efficiency goal in time!";
    } else {
      return "You didn't reach your sleep efficiency goal in time. Keep going!";
    }
  } else if (currentDate < new Date(targetDate)) {
    if (averageSleepEfficiency >= sleepEfficiencyGoal) {
      return "Congratulations! You achieved your sleep efficiency goal!";
    } else {
      return "Keep going! You are still working towards your sleep efficiency goal.";
    }
  } else {
    if (averageSleepEfficiency >= sleepEfficiencyGoal) {
      return "Congratulations! You achieved your sleep efficiency goal!";
    } else {
      return "You didn't reach your sleep efficiency goal. Keep going!";
    }
  }
}

app.get("/stats", sessionValidation, async (req, res) => {
  const name = req.session.name;
  const userId = req.session._id;

  const sleepEfficiencyData = await calculateSleepEfficiencyData(name);
  const sleepEfficiencies = sleepEfficiencyData.map((data) => data.sleepEfficiency);
  const dates = sleepEfficiencyData.map((data) => data.date);
  const averageSleepEfficiency =
    sleepEfficiencies.reduce((acc, efficiency) => acc + efficiency, 0) / sleepEfficiencies.length;
  const goalDocument = await goalCollection.findOne({ userId: userId });

  let sleepEfficiencyGoal = "";
  let targetDate = "";
  let goalMessage = "";
  let error = req.query.error; // Get the error message from the query parameter

  if (goalDocument) {
    sleepEfficiencyGoal = goalDocument.sleepEfficiencyGoal || "";
    targetDate = goalDocument.targetDate || "";
    goalMessage = calculateGoalStatus(targetDate, sleepEfficiencyGoal, averageSleepEfficiency);
  } else {
    goalMessage = calculateGoalStatus("", "", averageSleepEfficiency);
  }

  res.render("stats", {
    name: name,
    averageSleepEfficiency: averageSleepEfficiency,
    sleepEfficiencyGoal: sleepEfficiencyGoal,
    updatedSleepEfficiencyGoal: req.query.sleepEfficiencyGoal,
    sleepEfficiencies: JSON.stringify(sleepEfficiencies),
    dates: JSON.stringify(dates),
    targetDate: targetDate,
    goalMessage: goalMessage,
    error: error, // Pass the error variable to the template
  });
});

app.post("/updateGoal", sessionValidation, async (req, res) => {
  const name = req.session.name;
  const userId = req.session._id;

  let sleepEfficiencyGoal = req.body.goal;
  let targetDate = req.body.targetDate;

  // Check if the input is a valid number between 0 and 100 inclusive
  if (sleepEfficiencyGoal !== "") {
    const sleepEfficiencyGoalNumber = parseInt(sleepEfficiencyGoal);
    if (!isNaN(sleepEfficiencyGoalNumber) && sleepEfficiencyGoalNumber >= 0 && sleepEfficiencyGoalNumber <= 100) {
      // Check if the target date is valid and within the allowed range
      if (targetDate) {
        const currentDate = new Date();
        const selectedDate = new Date(targetDate);

        // Calculate the maximum allowed date
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 100);

        // Set the time to 0:00:00 to compare only the date
        selectedDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);

        if (selectedDate >= currentDate && selectedDate <= maxDate) {
          // Check if a goal document already exists for the user
          const existingGoal = await goalCollection.findOne({ userId: userId });
          if (existingGoal) {
            // Update the existing goal document
            await goalCollection.updateOne(
              { userId: userId },
              { $set: { sleepEfficiencyGoal: sleepEfficiencyGoalNumber, targetDate: targetDate } }
            );
          } else {
            // Create a new goal document for the user
            await goalCollection.insertOne({
              userId: userId,
              sleepEfficiencyGoal: sleepEfficiencyGoalNumber,
              targetDate: targetDate,
            });
          }

          // Update the session variables
          req.session.sleepEfficiencyGoal = sleepEfficiencyGoalNumber;
          req.session.targetDate = targetDate;

          res.redirect("/stats?sleepEfficiencyGoal=" + sleepEfficiencyGoalNumber);
          return;
        } else {
          // Target date is not within the allowed range
          res.redirect("/stats?error=InvalidDate");
          return;
        }
      }
    }
  }

  sleepEfficiencyGoal = req.session.sleepEfficiencyGoal || "";

  const sleepEfficiencyData = await calculateSleepEfficiencyData(name);
  const sleepEfficiencies = sleepEfficiencyData.map((data) => data.sleepEfficiency);
  const dates = sleepEfficiencyData.map((data) => data.date);
  const averageSleepEfficiency =
    sleepEfficiencies.reduce((acc, efficiency) => acc + efficiency, 0) / sleepEfficiencies.length;
  let goalMessage = "";

  if (targetDate) {
    goalMessage = calculateGoalStatus(targetDate, sleepEfficiencyGoal, averageSleepEfficiency);
  } else {
    goalMessage = calculateGoalStatus("", sleepEfficiencyGoal, averageSleepEfficiency);
  }

  res.render("stats", {
    name: name,
    averageSleepEfficiency: averageSleepEfficiency,
    sleepEfficiencyGoal: sleepEfficiencyGoal,
    targetDate: targetDate,
    updatedSleepEfficiencyGoal: "",
    sleepEfficiencies: JSON.stringify(sleepEfficiencies),
    dates: JSON.stringify(dates),
    goalMessage: goalMessage,
    error: "", // Set the error variable to an empty string
  });
});

// STORING DATA OF ANALYSIS IN MONGODB
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

function calculateAge(birthday) {
  const currentDate = new Date();
  const age = currentDate.getFullYear() - birthday.getFullYear();
  return age;
}

const factorsData = require('./app/data/facts.json');
app.post('/analysis', sessionValidation, async (req, res) => {
  const birthday = new Date(req.session.birthday);
  const age = calculateAge(birthday);
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
  // const caffeineCount = req.body.caffeineCount;
  console.log("req.body.caffeinecount:", req.body.caffeineCount);

  if (req.body.caffeineCount === "25 mg (1/3 cup)") {
    caffeineCount = 1;
  } else if (req.body.caffeineCount === "50 mg (2/3 cup)") {
    caffeineCount = 2;
  } else if (req.body.caffeineCount === "75 mg (1 cup)") {
    caffeineCount = 3;
  } else if (req.body.caffeineCount === "100 mg (1 1/3 cup)") {
    caffeineCount = 4;
  } else if (req.body.caffeineCount === "125 mg (1 2/3 cup)") {
    caffeineCount = 5;
  } else if (req.body.caffeineCount === "150 mg (2 cup)") {
    caffeineCount = 6;
  } else if (req.body.caffeineCount === "175 mg (2 1/3 cup)") {
    caffeineCount = 7;
  } else if (req.body.caffeineCount === "200 mg (2 2/3 cup)") {
    caffeineCount = 8;
  } else if (req.body.caffeineCount === "225 mg (3 cup)") {
    caffeineCount = 9;
  } else if (req.body.caffeineCount === "250+ mg (3 1/3+ cup)") {
    caffeineCount = 10;
  } else {
    caffeineCount = parseInt(req.body.caffeineCount);
  }
  console.log("caffeineCount:", caffeineCount);

  const WakeupCount = parseInt(req.body.wakeupCount);
  const alcoholCount = req.body.alcoholCount;
  const exerciseCount = req.body.exerciseCount;
  console.log(WakeupCount, alcoholCount, exerciseCount);
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
  const difference = Math.round(intercept - sleepEfficiency);

  if (caffeineCount == 0 && WakeupCount == 0 && alcoholCount == 0 && exerciseCount == 0 && sleepEfficiency < intercept) {
    // Render a different page when all factor values are zero
    res.render("analysisThree", {
      Intercept: intercept,
      SleepEfficiency: sleepEfficiency,
      MostNegativeFactor: mostNegativeFactorFromDB,
      RelevantFacts: relevantFacts,
      Difference: difference
    });
  }
  else if (matchingRange.age_range === '9-12' && sleepEfficiency < intercept) {
    res.render("analysisOne", {
      Intercept: intercept,
      SleepEfficiency: sleepEfficiency,
      MostNegativeFactor: mostNegativeFactor,
      RelevantFacts: relevantFacts,
      Difference: difference
    });
  } else if (sleepEfficiency >= intercept) {
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
      Factor: finalFactor
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

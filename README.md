# AISleep

## 1. Project Description
Our team, Burnaby 14, is developing AISleep to help tired workers and students get better quality sleep with personalized analysis on different habits affecting sleep efficiency that they can use to be informed and work towards increasing their sleep efficiency.

## 2. Names of Contributors
 
* Jimmy Tsang
* Sarah Liu
* Gurpinder Kaur
* Emily Lin
	
## 3. Technologies and Resources Used

* FrontEnd :  HTML, Bootstrap, and CSS
* BackEnd : Javascript, Jquery, EJS, and NodeJS with packages like joi.
* Database : MongoDB
* icons: https://icons.getbootstrap.com/
* Tips resource1: https://www.cdc.gov/sleep/about_sleep/sleep_hygiene.html
* Tips resource2: https://www.healthline.com/nutrition/ways-to-fall-asleep#The-bottom-line
* Music: https://www.youtube.com/watch?v=HGMQbVfYVmI&list=PL-iKWhQU41oOHDfz1I3tHA9xvNWmd35zY&index=8
* Profile Banner: https://www.freepik.com/free-vector/night-african-savannah-landscape-wild-nature-africa-twilight-view-cartoon-background-with-road-trees-rocks-birds-flying-starry-sky-with-full-moon-kenya-nighttime-vector-illustration_21994618.htm#query=night%20landscape&position=3&from_view=search&track=ais Image by upklyak on Freepik
* Profile Banner 2: https://www.freepik.com/free-photo/sunset-silhouettes-trees-mountains-generative-ai_39657505.htm#query=sunrise%20vector%20illustration&position=4&from_view=search&track=ais Image by pvproductions on Freepik


## 4. Contents of Folder

2800-202310-BBY14
|
|
|__ .env                        # file for secret passwords
├── .gitignore                  # Git ignore file
└──  databaseConnection.js      # MongoDB connection file                 
|__  index.js                   # server-side js file
|__  package-lock.json
|__  package.json
|__  README.md                  # readme file
|__  node_modules               # file for libraries of node.js
|
|__app\data                     # folder for having json files.
|    |
|    |__facts.json              # json file having facts related to sleep 
|    |
|    |
|    |__tips.json               # json file for tips to improve sleep.
│
├───public
│   │   profile_dummy.png
│   │
│   ├───images                  # folder for storing images used in app.
│   │       404.png
│   │       logo.png
│   │       logo2.png
│   │       logo3.png
│   │       logo_01.png
│   │       logo_02.png
│   │       logo_03.png
│   │       logo_04.png
│   │       logo_05.png
│   │       logo_06.png
│   │       logo_07.png
│   │       logo_08.png
│   │       logo_09.png
│   │       pok.jpg
│   │       profilebanner.jpg
│   │       profilebanner2.jpg
│   │       welldone.png
│   │
│   ├───js                      # front end javascript folder
│   │       client.js
│   │
│   ├───music                   # folder for storing music.
│   │       easter_egg_music.m4a
│   │
│   ├───profileImages           # folder for images used for profile page
│   │       profilepic1.png
│   │       profilepic2.png
│   │       profilepic3.png
│   │       profilepic4.png
│   │       profilepic5.png
│   │
│   └───styles                  # folder for css files.
│           style.css
│
└───views                       # folder for ejs files.
    │   403.ejs
    │   404.ejs
    │   about.ejs
    │   analysis.ejs
    │   analysisOne.ejs
    │   analysisThree.ejs
    │   analysisTwo.ejs
    │   checkemail.ejs
    │   createreport.ejs
    │   easter_egg.ejs
    │   facts.ejs
    │   forgotpassword.ejs
    │   index.ejs
    │   index_user.ejs
    │   login-error.ejs
    │   login.ejs
    │   main.ejs
    │   newreport.ejs
    │   preferences.ejs
    │   problem.ejs
    │   problem_error.ejs
    │   profile.ejs
    │   profile_error.ejs
    │   report_list.ejs
    │   reset-error.ejs
    │   resetpassword.ejs
    │   security.ejs
    │   settings.ejs
    │   signup.ejs
    │   signup_error.ejs
    │   stats.ejs
    │
    └───templates            # folder for common ejs files.
            footer.ejs
            header_goback.ejs
            header_main.ejs
            header_settings.ejs
            report_list_item.ejs
            svg.ejs



## 5. How to install or run the project :

* As a new developer, it is important to have access to our GitHub repository and the necessary permissions to collaborate. 
* Should possess the following skills and resources: :
a. Proficiency in front-end languages such as HTML, Bootstrap, and CSS. For the back-end, familiarity with JavaScript, jQuery, EJS, and Node.js is essential. It's also beneficial to have knowledge of packages like Joi for validation.

b. An IDE like Visual Studio Code is recommended, with Node.js support and all the necessary Node.js extensions installed. This includes Express, Express-Session, Connect-Mongo, Joi, Bcrypt, UUID, Method-Override, Connect-Flash, @sendgrid/mail, MongoDB, Dotenv and utis.

c. In order to interact with the database effectively, it is essential to have access to MongoDB. This entails having the appropriate passwords and secrets to establish a connection with the database. These sensitive credentials are securely stored in a separate file named .env, which exclusively holds the required information for connecting to the MongoDB database. It is crucial to ensure to have access to this .env file, as it contains the necessary credentials and secrets needed for successful MongoDB database connection but this is not included in repository.

d. In order to perform analysis on sleep data and provide recommendations, it is necessary to have access to the Python script generated for the Kaggle datasets related to sleep. This access will enable  to make any necessary amendments or modifications to the script as needed. Having control over the Python script allows  to conduct the analysis effectively and tailor it according to the specific requirements of the sleep data analysis.


## 5. Complete setup/installion/usage
State what a user needs to do when they come to your project.  How do others start using your code or application?
Here are the steps
*  
* ...
* ...

## 5. Known Bugs and Limitations
Here are some known bugs:
* ...
* ...
* ...

## 6. Features for Future
What we'd like to build in the future:
* ...
* ...
* ...
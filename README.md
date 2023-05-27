# AISleep

## 1. Project Description
Our team, Burnaby 14, is developing AISleep to help tired workers and students get better quality sleep with personalized analysis on different habits affecting sleep efficiency that they can use to be informed and work towards increasing their sleep efficiency.

## 2. Names of Contributors
 
* Jimmy Tsang
* Sarah Liu
* Gurpinder Kaur
* Emily Lin
	
## 3. Technologies  Used

* FrontEnd :  HTML, Bootstrap, and CSS
* BackEnd : Javascript, Jquery, EJS, and NodeJS with packages like joi.
* Database : MongoDB
* icons: https://icons.getbootstrap.com/

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


## 6.  Features

* As a user, you can begin by opening the app using the link: https://extinct-red-betta.cyclic.app/ in any search engine. Sign up to initiate the process of tracking your sleeping habits.
* To generate a sleep report, simply click on "Get Started" on main page and input your sleep records. You will receive a sleep efficiency score and analysis based on your sleep patterns.
* For a weekly sleep efficiency overview, check the stats page located at the bottom left corner. This will help you assess whether your sleep quality is improving or not.
* Don't forget to explore the "Facts" section for quick and helpful advice related to sleep.
* To enhance your user experience, visit the settings page located in the top right corner. It provides additional features such as checking your profile, changing your password, and reporting any issues you may encounter while using the app.
* Our app offers a user-friendly environment with a dark mode option. You can enable this by going to the settings page, selecting "Preferences," and choosing your preferred viewing mode.
* For a pleasant surprise, visit the "About Us" page located at the top-left corner. Click on the app logo multiple times, and it will take you to an interactive puzzle activity accompanied by relaxing music.
* Furthermore, you can view your sleep records by accessing the "View Report List" page on the main app page.

## 7.  Credits, References, and Licenses

** Credits:

---Gurpinder Kaur played a significant role in developing the settings section of the project, which encompasses various pages such as the profile page, security settings, preferences, and report problem functionality. She contributed to both the front-end and back-end development of these pages.

Furthermore, Gurpinder made valuable contributions to the Minimum Viable Product (MVP) by implementing accurate analysis algorithms that generate insights based on user input data. Her expertise ensured that the analysis provided by the application is reliable and relevant to the user's sleep patterns

---Jimmy played a crucial role in the project as a designer, utilizing his expertise to create the logo and design the overall layout of the application. His contributions ensured a consistent and visually appealing user interface throughout the app. Additionally, Jimmy took charge of setting up the CSS styling for the entire application, including both the light and dark modes.

In terms of the Minimum Viable Product (MVP), he actively participated in the decision-making process to determine the appropriate questions to ask users in order to calculate sleep efficiency. He worked diligently on both the front-end and back-end aspects, ensuring that user data was securely stored in the database

---Emily made significant contributions to the project across various areas. She played a key role in testing and debugging, ensuring that the application functioned smoothly and addressing any issues that arose. Additionally, Emily took charge of creating the tips page, enriching the user experience by providing random tips related to the sleep score. 

 She demonstrated her expertise in both front-end and back-end development while accurately capturing and processing user input data for calculating sleep efficiency. Furthermore, Emily's creativity shone through as she contributed to an interactive easter egg feature. Her multifaceted contributions greatly enhanced the application's functionality and user engagement.

---Sarah played a crucial role in the project as she initiated the repository and provided valuable assistance in resolving git conflicts, ensuring smooth collaboration among team members. She was responsible for developing the login and signup pages, incorporating essential authentication features. 

 Additionally, Sarah implemented sleep efficiency statistics with visually appealing graphs. Her editing skills came to the fore as she dedicated her efforts to polishing the final presentation Her expertise in front-end and back-end development greatly contributed to the project's functionality and overall success.

** References:


* Tips resource1: https://www.cdc.gov/sleep/about_sleep/sleep_hygiene.html
* Tips resource2: https://www.healthline.com/nutrition/ways-to-fall-asleep#The-bottom-line
* Music: https://www.youtube.com/watch?v=HGMQbVfYVmI&list=PL-iKWhQU41oOHDfz1I3tHA9xvNWmd35zY&index=8
* Profile Banner: https://www.freepik.com/free-vector/night-african-savannah-landscape-wild-nature-africa-twilight-view-cartoon-background-with-road-trees-rocks-birds-flying-starry-sky-with-full-moon-kenya-nighttime-vector-illustration_21994618.htm#query=night%20landscape&position=3&from_view=search&track=ais Image by upklyak on Freepik
* Profile Banner 2: https://www.freepik.com/free-photo/sunset-silhouettes-trees-mountains-generative-ai_39657505.htm#query=sunrise%20vector%20illustration&position=4&from_view=search&track=ais Image by pvproductions on Freepik
* Default Profile Picture: https://www.flaticon.com/free-icon/profile_3135715 User icons created by Freepik - Flaticon
* Profile Picture 1: https://www.youtube.com/watch?v=Ecm6v8-pkrg Created by Shreyansh Kotak
* Profile Picture 2: https://www.istockphoto.com/vector/woman-sleeping-at-night-in-his-bed-and-sees-dream-in-speech-bubble-gm1153827147-313510918 Image by Ponomariova Maria on iStock
* Profile Picture 3: https://www.freepik.com/free-vector/card-asleep-man-dog_28807566.htm#query=sleeping%20man&position=29&from_view=keyword&track=ais Image by gstudioimagen1 on Freepik
* Profile Picture 4: https://www.freepik.com/premium-vector/coffee-vector-art-flat-design-adobe-illustrator_31597265.htm Image by cherrybeecheng on Freepik
* Profile Picture 5: https://www.istockphoto.com/vector/wooden-bed-for-one-person-in-an-isometric-view-gm898206528-247795954 Image by Ponomariova Maria on iStock
* Logo images, Welldone.png, 404.png: Designed in Adobe Illustrator by Jimmy Tsang

** Licenses:

## 5. Complete setup/installion/usage
State what a user needs to do when they come to your project.  How do others start using your code or application?
Here are the steps
*  
* ...
* ...

## 5. Known Bugs and Limitations
Here are some known bugs and limitations:
* In rare instances, it is possible to get the alert of having already made the day's report even when you have deleted all reports.
* You can only choose from a select number of profile pictures.
* The stats page graph does not have a dark mode friendly colour scheme.

## 6. Features for Future
What we'd like to build in the future:
* We would like to build a more comprehensive music function that would connect with the Spotify API, and allow users to search for, favourite, and play music that helps them sleep.
* We would like to find more habits that affect sleep efficiency, and include them in our report as well.
* We would like to expand on the stats page so that users can see a day by day breakdown of their sleep efficiency score (i.e, a user would be able to see stats for each day of the week).
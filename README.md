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
* BackEnd : Javascript, Jquery, EJS, and NodeJS
* Database : MongoDB
* icons: https://icons.getbootstrap.com/

## 4. Contents of Folder
Content of the project folder:

```
 Top level of project folder: 
├── .env                          # (Not included) Stores project configuration variables
├── .gitignore                    # Git ignore file
├── databaseConnection.js         # MongoDB connection file
├── index.js                      # Main server-side file
├── package-lock.json             # Ensures consistent dependency installation in Node.js
├── package.json                  # Node.js dependency config
├── utils.js                      # Provides global utility functions to handle file paths
└── README.md

It has the following subfolders and files:
├── .git                          # (Not included) Folder for git repo

├── node_modules                  # (Not included) Folder for all project NodeJS dependencies

├── app/data                      # Folder for JSON files
    /facts.json                   # Collection of sleep related facts
    /tips.json                    # Collection of sleep related tips

├── public                        # Folder for static files
    ├── images                    # Folder for images
    |   └── profileImages         # Folder for profile images
    |       /default.png          # Default profile picture
    |       /profilepic1.png      # Profile picture type 1
    |       /profilepic2.png      # Profile picture type 2
    |       /profilepic3.png      # Profile picture type 3
    |       /profilepic4.png      # Profile picture type 4
    |       /profilepic5.png      # Profile picture type 5
    |   /404.png                  # 404 sad logo
    |   /logo.png                 # Logo type 1
    |   /logo2.png                # Logo type 2
    |   /logo3.png                # Logo type 3
    |   /logo_01.png              # Easter egg puzzle piece 1
    |   /logo_02.png              # Easter egg puzzle piece 2
    |   /logo_03.png              # Easter egg puzzle piece 3
    |   /logo_04.png              # Easter egg puzzle piece 4
    |   /logo_05.png              # Easter egg puzzle piece 5
    |   /logo_06.png              # Easter egg puzzle piece 6
    |   /logo_07.png              # Easter egg puzzle piece 7
    |   /logo_08.png              # Easter egg puzzle piece 8
    |   /logo_09.png              # Easter egg puzzle piece 9
    |   /profilebanner.jpg        # Dark mode profile banner
    |   /profilebanner2.jpg       # Light mode profile banner
    |   /welldone.png             # Well done happy logo
    ├── js                        # Folder for scripts
    |   /client.js                # Contains globally used functions
    ├── music                     # Folder for music
    |   /easter_egg_music.m4a     # Background music for easter egg page
    └── styles                    # Folder for styling
        /style.css                # Global styling and layouts

├── views                         # Folder for EJS templates
    └── templates                 # Folder for header and footer templates
        /footer.ejs               # Footer template
        /header_goback.ejs        # General header template
        /header_main.ejs          # Main page header template
        /header_settings.ejs      # Settings page header template
        /report_list_item.ejs     # Reports list template
        /svg.ejs                  # SVGs
    /404.ejs                      # 404 page
    /about.ejs                    # About page
    /analysis.ejs                 # Analysis page
    /analysisOne.ejs              # Type 1 analysis page
    /analysisThree.ejs            # Type 3 analysis page
    /analysisTwo.ejs              # Type 2 anaylsis page
    /checkemail.ejs               # Check email page
    /createreport.ejs             # Create report page
    /easter_egg.ejs               # Easter egg page
    /facts.ejs                    # Facts page
    /forgotpassword.ejs           # Forgot password page
    /index.ejs                    # Index page
    /index_user.ejs               # Index page (logged in)
    /login-error.ejs              # Login error page
    /login.ejs                    # Login page
    /main.ejs                     # Main page
    /newreport.ejs                # Report page
    /preferences.ejs              # Preferences page
    /problem.ejs                  # Report a problem page
    /problem_error.ejs            # Report problem error page
    /profile.ejs                  # Profile page
    /profile_error.ejs            # Profile error page
    /report_list.ejs              # Reports list page
    /reset-error.ejs              # Password reset error page
    /resetpassword.ejs            # Reset password page 
    /security.ejs                 # Change password page
    /settings.ejs                 # Settings page
    /signup.ejs                   # Signup page
    /signup_error.ejs             # Signup error page
    /stats.ejs                    # Stats page

```

## 5. How to install or run the project
As a new developer, it is important to have access to our GitHub repository and the necessary permissions to collaborate. You should possess the following skills and resources:

* Proficiency in front-end languages such as HTML, Bootstrap, and CSS. For the back-end, familiarity with JavaScript, jQuery, EJS, and Node.js is essential. It's also beneficial to have knowledge of packages like Joi for validation.

* An IDE like Visual Studio Code is recommended, with Node.js support and all the necessary Node.js extensions installed. This includes Express, Express-Session, Connect-Mongo, Joi, Bcrypt, UUID, Method-Override, Connect-Flash, @sendgrid/mail, MongoDB, Dotenv and utis.

* In order to interact with the database effectively, it is essential to have access to MongoDB. This entails having the appropriate passwords and secrets to establish a connection with the database. These sensitive credentials are securely stored in a separate file named .env, which exclusively holds the required information for connecting to the MongoDB database. It is crucial to ensure to have access to this .env file, as it contains the necessary credentials and secrets needed for successful MongoDB database connection but this is not included in repository.

* In order to perform analysis on sleep data and provide recommendations, it is necessary to have access to the Python script generated for the Kaggle datasets related to sleep. This access will enable  to make any necessary amendments or modifications to the script as needed. Having control over the Python script allows  to conduct the analysis effectively and tailor it according to the specific requirements of the sleep data analysis.

* 


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
### Credits:
* Gurpinder Kaur played a significant role in developing the settings section of the project, which encompasses various pages such as the profile page, security settings, preferences, and report problem functionality. She contributed to both the front-end and back-end development of these pages. Furthermore, Gurpinder made valuable contributions to the Minimum Viable Product (MVP) by implementing accurate analysis algorithms that generate insights based on user input data. Her expertise ensured that the analysis provided by the application is reliable and relevant to the user's sleep patterns

* Jimmy played a crucial role in the project as a designer, utilizing his expertise to create the logo and design the overall layout of the application. His contributions ensured a consistent and visually appealing user interface throughout the app. Additionally, Jimmy took charge of setting up the CSS styling for the entire application, including both the light and dark modes. In terms of the Minimum Viable Product (MVP), he actively participated in the decision-making process to determine the appropriate questions to ask users in order to calculate sleep efficiency. He worked diligently on both the front-end and back-end aspects, ensuring that user data was securely stored in the database

* Emily made significant contributions to the project across various areas. She played a key role in testing and debugging, ensuring that the application functioned smoothly and addressing any issues that arose. Additionally, Emily took charge of creating the tips page, enriching the user experience by providing random tips related to the sleep score. She demonstrated her expertise in both front-end and back-end development while accurately capturing and processing user input data for calculating sleep efficiency. Furthermore, Emily's creativity shone through as she contributed to an interactive easter egg feature. Her multifaceted contributions greatly enhanced the application's functionality and user engagement.

* Sarah played a crucial role in the project as she initiated the repository and provided valuable assistance in resolving git conflicts, ensuring smooth collaboration among team members. She was responsible for developing the login and signup pages, incorporating essential authentication features. Additionally, Sarah implemented sleep efficiency statistics with visually appealing graphs. Her editing skills came to the fore as she dedicated her efforts to polishing the final presentation Her expertise in front-end and back-end development greatly contributed to the project's functionality and overall success.

### References:
* Tips resource 1: https://www.cdc.gov/sleep/about_sleep/sleep_hygiene.html
* Tips resource 2: https://www.healthline.com/nutrition/ways-to-fall-asleep#The-bottom-line
* Music: https://www.youtube.com/watch?v=HGMQbVfYVmI&list=PL-iKWhQU41oOHDfz1I3tHA9xvNWmd35zY&index=8
* Profile Banner: https://www.freepik.com/free-vector/night-african-savannah-landscape-wild-nature-africa-twilight-view-cartoon-background-with-road-trees-rocks-birds-flying-starry-sky-with-full-moon-kenya-nighttime-vector-illustration_21994618.htm#query=night%20landscape&position=3&from_view=search&track=ais Image by upklyak on Freepik
* Profile Banner 2: https://www.freepik.com/free-photo/sunset-silhouettes-trees-mountains-generative-ai_39657505.htm#query=sunrise%20vector%20illustration&position=4&from_view=search&track=ais Image by pvproductions on Freepik

### Licenses:
* None

## 8. How We Used AI


## 9. Contact Information


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
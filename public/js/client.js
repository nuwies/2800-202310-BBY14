

// tips page
function getRandomTip() {
    fetch('/tips-data')
        .then(response => response.json())
        .then(data => {
            const tipTextElement = document.getElementById('tip-text');
            const randomTip = data.tips[Math.floor(Math.random() * data.tips.length)].text;
            tipTextElement.innerText = randomTip;
        })
        .catch(error => console.log(error));
}
getRandomTip();


const darkModeToggle = document.querySelector('#dark-mode-toggle');
const body = document.querySelector('body');

// Check for saved dark mode preference on page load
const userPreference = localStorage.getItem('dark-mode');

// If user preference is set, apply it
if (userPreference) {
  body.classList.toggle('dark-mode', userPreference === 'true');
  darkModeToggle.checked = userPreference === 'true';
} else {
  // If user preference is not set, check the system preference
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
  body.classList.toggle('dark-mode', prefersDarkMode.matches);
  darkModeToggle.checked = prefersDarkMode.matches;
}

// Listen for dark mode toggle clicks and toggle class on body
darkModeToggle.addEventListener('click', () => {
  const isDarkMode = body.classList.toggle('dark-mode');
  localStorage.setItem('dark-mode', isDarkMode);
  // navbar.classList.toggle('dark-mode', isDarkMode);
});



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

// Check if dark mode preference is set, if so, enable it
const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
if (prefersDarkMode.matches) {
  body.classList.add('dark-mode');
  darkModeToggle.checked = true;
}

// Listen for dark mode toggle clicks and toggle class on body
darkModeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  localStorage.setItem('dark-mode', body.classList.contains('dark-mode'));
});

// Check for saved dark mode preference on page load
if (localStorage.getItem('dark-mode')) {
  body.classList.add('dark-mode');
  darkModeToggle.checked = true;
}

// tips
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


// facts
function getRandomFact() {
  fetch('/facts-data')
      .then(response => response.json())
      .then(data => {
          const factTextElement = document.getElementById('fact-explanation');
          const factReasonElement = document.getElementById('fact-reason');

          const randomCategory = Math.floor(Math.random() * 3);

          let randomindex;
          let randomReason;
          let randomExplanation;
          if (randomCategory === 0) {
            randomindex = Math.floor(Math.random() * data.caffeine.length);
            randomReason = data.caffeine[randomindex].reason;
            randomExplanation = data.caffeine[randomindex].explanation;
          } else if (randomCategory === 1) {
            randomindex = Math.floor(Math.random() * data.alcohol.length);
            randomReason = data.alcohol[randomindex].reason;
            randomExplanation = data.alcohol[randomindex].explanation;
          } else {
            randomindex = Math.floor(Math.random() * data.exercise.length);
            randomReason = data.exercise[randomindex].reason;
            randomExplanation = data.exercise[randomindex].explanation;
          }

          factReasonElement.innerText = randomReason;
          factTextElement.innerText = randomExplanation;
      })
      .catch(error => console.log(error));
}
getRandomFact();







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

// facts_page random tips
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


// facts_page random facts
function getRandomFact() {
  fetch('/facts-data')
    .then(response => response.json())
    .then(data => {
      const factTextElement = document.getElementById('fact-explanation');
      const factReasonElement = document.getElementById('fact-reason');

      const randomCategory = Math.floor(Math.random() * 4);

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
      } else if (randomCategory === 2) {
        randomindex = Math.floor(Math.random() * data.exercise.length);
        randomReason = data.exercise[randomindex].reason;
        randomExplanation = data.exercise[randomindex].explanation;
      } else {
        randomindex = Math.floor(Math.random() * data.awaking.length);
        randomReason = data.awaking[randomindex].reason;
        randomExplanation = data.awaking[randomindex].explanation;
      }

      factReasonElement.innerText = randomReason;
      factTextElement.innerText = randomExplanation;
    })
    .catch(error => console.log(error));
}
getRandomFact();



// createreport_page dropdown menus
const caffeineDropdown = document.getElementById('caffeine');
const caffeineAmountDiv = document.getElementById('caffeineamount');
const alcoholDropdown = document.getElementById('alcohol');
const alcoholAmountDiv = document.getElementById('alcoholamount');
const exerciseDropdown = document.getElementById('exercise');
const exerciseAmountDiv = document.getElementById('exerciseamount');

if (caffeineDropdown) {
  caffeineDropdown.addEventListener('change', () => {
    if (caffeineDropdown.value === 'Yes') {
      caffeineAmountDiv.style.display = 'block';
    } else {
      caffeineAmountDiv.style.display = 'none';
    }
  });
}
if (alcoholDropdown) {
  alcoholDropdown.addEventListener('change', () => {
    if (alcoholDropdown.value === 'Yes') {
      alcoholAmountDiv.style.display = 'block';
    } else {
      alcoholAmountDiv.style.display = 'none';
    }
  });
}
if (exerciseDropdown) {
  exerciseDropdown.addEventListener('change', () => {
    if (exerciseDropdown.value === 'Yes') {
      exerciseAmountDiv.style.display = 'block';
    } else {
      exerciseAmountDiv.style.display = 'none';
    }
  });
}





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

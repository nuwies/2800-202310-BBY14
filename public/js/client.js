// facts_page random tips
function getRandomTip() {
  fetch('/tips-data')
    .then(response => response.json())
    .then(data => {
      const tipTextElement = document.getElementById('tip-text');
      if (tipTextElement) {
        const randomTip = data.tips[Math.floor(Math.random() * data.tips.length)].text;
        tipTextElement.innerText = randomTip;
      }
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

      if (!factTextElement || !factReasonElement) {
        return;
      }
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


//puzzle
var puzzle = document.getElementById("puzzle");

if (puzzle) {
  var congratulationsText = document.getElementById("congratulationsText");
  var context = puzzle.getContext('2d');
  puzzle.height = "250";
  puzzle.width = "250";
  var gap = 5;
  var row = 3;
  var pieceWidth = (puzzle.width - (gap * (row + 1))) / row;
  var lastIndex = (row * row - 1);
  var positionIndex = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  // initial random position
  var lists = [
    [4, 3, 2, 8, 0, 7, 5, 6, 1],
    [2, 0, 5, 6, 8, 7, 3, 1, 4],
    [3, 7, 2, 4, 1, 6, 8, 0, 5],
    [3, 2, 4, 1, 7, 6, 5, 0, 8]
  ];

  positionIndex = lists[Math.floor(Math.random() * 4)];
  var emptyPosition = positionIndex.indexOf(lastIndex);

  var times = 10;
  while (times--) {
    var direction = Math.floor(Math.random() * 4);
    var target = -1;

    switch (direction) {
      case 0:
        target = topOfPosition(emptyPosition);
        break;
      case 1:
        target = leftOfPosition(emptyPosition);
        break;
      case 2:
        target = rightOfPosition(emptyPosition);
        break;
      case 3:
        target = bottomOfPosition(emptyPosition);
        break;
    }

    if (target >= 0 && target <= lastIndex) {
      var result = moveImageIfCanAtPosition(target);
      if (result >= 0) {
        emptyPosition = target;
      }
    }
  }

  for (var position = 0; position < row * row; position++) {
    var index = positionIndex[position];
    if (index == lastIndex) {
      continue;
    }
    drawImageItem(index, position);
  }

  puzzle.onclick = function (e) {
    if (ifFinish()) {
      return; // Puzzle is already solved, return without doing anything
    }

    var x = Math.floor(e.offsetX / (gap + pieceWidth));
    var y = Math.floor(e.offsetY / (gap + pieceWidth));
    var position = y * row + x;
    var target = moveImageIfCanAtPosition(position);

    //refresh
    if (target >= 0) {
      var rect = rectForPosition(position);
      context.clearRect(rect[0], rect[1], rect[2], rect[3]);
      drawImageItem(positionIndex[target], target);
    }

    if (ifFinish()) {
      drawImageItem(positionIndex[lastIndex], lastIndex);
      congratulationsText.style.display = "block";
      return;
    }
  };

  function ifFinish() {
    return positionIndex.every(function (value, index) {
      return value === index;
    });
  }

  function drawImageItem(index, position) {
    var img = new Image();
    img.src = `./images/logo_0${index + 1}.png`;
    img.onload = () => {
      var rect = rectForPosition(position);
      context.drawImage(img, rect[0], rect[1], rect[2], rect[3]);
    }
  }

  function moveImageIfCanAtPosition(position) {
    var top = topOfPosition(position);
    var left = leftOfPosition(position);
    var bottom = bottomOfPosition(position);
    var right = rightOfPosition(position);
    var targetPosition = -1;

    if (isPositionEmpty(top)) {
      targetPosition = top;
    } else if (isPositionEmpty(left)) {
      targetPosition = left;
    } else if (isPositionEmpty(bottom)) {
      targetPosition = bottom;
    } else if (isPositionEmpty(right)) {
      targetPosition = right;
    }

    if (targetPosition >= 0) {
      positionIndex[targetPosition] = positionIndex[position];
      positionIndex[position] = lastIndex;
      puzzle.emptyPosition = position;
      return targetPosition;
    }
    return -1;
  }

  function isPositionEmpty(position) {
    if (position < 0 || position > lastIndex) {
      return false;
    }
    return positionIndex[position] === lastIndex;
  }

  function rectForPosition(position) {
    if (position < 0 || position > lastIndex) {
      return [0, 0, 0, 0];
    }
    var x = (position % row) * (gap + pieceWidth) + gap;
    var y = Math.floor(position / row) * (gap + pieceWidth) + gap;
    return [x, y, pieceWidth, pieceWidth];
  }

  function leftOfPosition(position) {
    return (position % row) === 0 ? -1 : position - 1;
  }

  function rightOfPosition(position) {
    return (position % row) === (row - 1) ? -1 : position + 1;
  }

  function topOfPosition(position) {
    return position - row;
  }

  function bottomOfPosition(position) {
    return position + row;
  }
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
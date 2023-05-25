//report_list
const deleteReport = document.getElementById("deleteReport");
if (deleteReport) {
  function confirmDelete() {
    return confirm("Are you sure you want to delete this report?");
  }
}


//easter egg page music
const audio = document.getElementById("myAudio");
if (audio) {
  window.addEventListener('DOMContentLoaded', function () {
    var muteButton = document.getElementById("muteButton");
    muteButton.addEventListener('click', function () {
      if (audio.muted) {
        audio.muted = false;
        muteButton.innerHTML = '<svg class="bi" width="24" height="24"><use xlink:href="#unmute"></use></svg>';
      } else {
        audio.muted = true;
        muteButton.innerHTML = '<svg class="bi" width="24" height="24"><use xlink:href="#mute"></use></svg>';
      }
    });
  });
}


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
  var eachPicWidth = (puzzle.width - (gap * (row + 1))) / row;
  var lastIndex = (row * row - 1);
  var randomPositionArray = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  var solvable = false;
  while (!solvable) {
    // Shuffle the array
    for (var i = randomPositionArray.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = randomPositionArray[i];
      randomPositionArray[i] = randomPositionArray[j];
      randomPositionArray[j] = temp;
    }
    console.log("randomPositionArray: " + randomPositionArray);

    // Check if the array has an even number of inversions
    var inversions = 0;
    var emptyPosition = randomPositionArray.indexOf(lastIndex);
    console.log("emptyPosition: " + emptyPosition);
    var emptyRowFromBottom = Math.floor(emptyPosition / row) + 1;

    for (var i = 0; i < randomPositionArray.length - 1; i++) {
      for (var j = i + 1; j < randomPositionArray.length; j++) {
        if (randomPositionArray[i] > randomPositionArray[j] && randomPositionArray[i] !== lastIndex && randomPositionArray[j] !== lastIndex) {
          inversions++;
        }
      }
    }
    console.log("inversions: " + inversions);

    // Determine solvability based on inversions and empty position
    if ((row % 2 === 1 && inversions % 2 === 0) || (row % 2 === 0 && ((emptyRowFromBottom % 2 === 0) === (inversions % 2 === 1)))) {
      solvable = true;
    }
    console.log("solvable: " + solvable);
  }

  var times = 10;
  while (times--) {
    var direction = Math.floor(Math.random() * 4);
    var target = -1;

    switch (direction) {
      case 0:
        target = topPosition(emptyPosition);
        break;
      case 1:
        target = leftPosition(emptyPosition);
        break;
      case 2:
        target = rightPosition(emptyPosition);
        break;
      case 3:
        target = bottomPosition(emptyPosition);
        break;
    }

    if (target >= 0 && target <= lastIndex) {
      var result = movePic(target);
      if (result >= 0) {
        emptyPosition = target;
      }
    }
  }

  for (var position = 0; position < row * row; position++) {
    var index = randomPositionArray[position];
    if (index == lastIndex) {
      continue;
    }
    drawEachPic(index, position);
  }

  puzzle.onclick = function (e) {
    if (ifFinish()) {
      return; // Puzzle is already solved, return without doing anything
    }

    var x = Math.floor(e.offsetX / (gap + eachPicWidth));
    var y = Math.floor(e.offsetY / (gap + eachPicWidth));
    var position = y * row + x;
    var target = movePic(position);

    //refresh
    if (target >= 0) {
      var rect = rectPosition(position);
      context.clearRect(rect[0], rect[1], rect[2], rect[3]);
      drawEachPic(randomPositionArray[target], target);
    }

    if (ifFinish()) {
      drawEachPic(randomPositionArray[lastIndex], lastIndex);
      congratulationsText.style.display = "block";
      return;
    }
  };

  function ifFinish() {
    return randomPositionArray.every(function (value, index) {
      return value === index;
    });
  }

  function drawEachPic(index, position) {
    var img = new Image();
    img.src = `./images/logo_0${index + 1}.png`;
    img.onload = () => {
      var rect = rectPosition(position);
      context.drawImage(img, rect[0], rect[1], rect[2], rect[3]);
    }
  }

  function movePic(position) {
    var top = topPosition(position);
    var left = leftPosition(position);
    var bottom = bottomPosition(position);
    var right = rightPosition(position);
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
      randomPositionArray[targetPosition] = randomPositionArray[position];
      randomPositionArray[position] = lastIndex;
      puzzle.emptyPosition = position;
      return targetPosition;
    }
    return -1;
  }

  function isPositionEmpty(position) {
    if (position < 0 || position > lastIndex) {
      return false;
    }
    return randomPositionArray[position] === lastIndex;
  }

  function rectPosition(position) {
    if (position < 0 || position > lastIndex) {
      return [0, 0, 0, 0];
    }
    var x = (position % row) * (gap + eachPicWidth) + gap;
    var y = Math.floor(position / row) * (gap + eachPicWidth) + gap;
    return [x, y, eachPicWidth, eachPicWidth];
  }

  function leftPosition(position) {
    return (position % row) === 0 ? -1 : position - 1;
  }

  function rightPosition(position) {
    return (position % row) === (row - 1) ? -1 : position + 1;
  }

  function topPosition(position) {
    return position - row;
  }

  function bottomPosition(position) {
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


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
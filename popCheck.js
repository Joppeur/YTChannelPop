"use strict;"

console.log(data);
var responseTest;

// Domain restricted API key, also hidden in .gitignore so Google doesn't disable it.
const apiKey = hiddenAPIKey;


window.addEventListener("load", function (e) {
    loadClient();


    // let sorted = data[1].sort((a, b) => (a.value > b.value) ? -1 : 1);
    // console.log(JSON.stringify(sorted));


    let input = document.getElementById('ytchannel');
    let searchButton = document.getElementById('search');
    let results = document.getElementById('results');
    searchButton.addEventListener("click", function () {
        let channelId = parseChannelID(input.value);
        if (channelId) {
            input.setCustomValidity("");
            results.hidden = false;
            execute(channelId);
        } else {
            input.setCustomValidity("Wrong Youtube channel URL format");
            input.reportValidity();
            input.value = "";
        }
    });
});



gapi.load("client");



function execute(channelId) {
    return gapi.client.youtube.channels.list({

        "part": [
            "snippet, statistics"
        ],
        "id": [
            channelId
        ]
    })
        .then(function (response) {
            console.log("Response", response.result);
            responseTest = response.result;
            parseResponse(response);
        },
            function (err) { console.error("Execute error", err); });
}


// Returns the text after slash or text between two last slashes if string ends with slash
function parseChannelID(channelURL) {
    let string = channelURL.trim();

    if (!channelURL.includes('youtube')) {
        console.error('Wrong channel URL format');
        return null;
    }

    if(string.endsWith('/')) {
        string = string.substring(0, string.length - 1);
    }
    let lastSlash = string.lastIndexOf('/');
    string = string.substring(lastSlash + 1);
    return string;
}


function loadClient() {
    gapi.client.setApiKey(apiKey);
    return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest")
        .then(function () { console.log("GAPI client loaded for API"); },
            function (err) { console.error("Error loading GAPI client for API", err); });
}


function parseResponse(response) {

    let subscriberCount = response.result.items[0].statistics.subscriberCount;
    let channelName = response.result.items[0].snippet.title;
    console.log(channelName);
    console.log("Subscribers: ", parseNumber(subscriberCount));

    let channelNameEl = document.getElementById('channelName');
    channelNameEl.textContent = channelName;

    let subscriberCountEl = document.getElementById('subscriberCount');
    subscriberCountEl.textContent = parseNumber(subscriberCount);

    let closestCountries = closestCountriesByPop(subscriberCount);

    let countriesEl = document.getElementById('countryList');

    for (let i = 0; i < closestCountries[1].length; i++) {
        let li = document.createElement('li');
        const country = closestCountries[1][i];
        let countryNameEl = document.createElement('h3');
        countryNameEl.textContent = country.country.value;

        let populationEl = document.createElement('span');
        populationEl.textContent = parseNumber(country.value);

        li.appendChild(countryNameEl);
        li.appendChild(populationEl);
        li.style.backgroundColor = 'salmon';
        countriesEl.appendChild(li);
    }


    for (let i = 0; i < closestCountries[0].length; i++) {
        let li = document.createElement('li');
        const country = closestCountries[0][i];
        let countryNameEl = document.createElement('h3');
        countryNameEl.textContent = country.country.value;

        let populationEl = document.createElement('span');
        populationEl.textContent = parseNumber(country.value);

        li.appendChild(countryNameEl);
        li.appendChild(populationEl);
        li.style.backgroundColor = 'palegreen';
        countriesEl.appendChild(li);
    }


}


// Return three higher pop countries and three lower pop countries (if there are any)
function closestCountriesByPop(subscriberCount) {
    subscriberCount = parseInt(subscriberCount);
    let closestCountry = data[1][0];
    let closestLowerThree = [];
    let closestHigherThree = [];

    let closest;
    closestIdx = 0;
    for (let i = 0; i < data[1].length; i++) {
        const population = data[1][i].value;
        if (population != null && Math.abs(subscriberCount - population) < Math.abs(subscriberCount - closestCountry.value)) {
            closestCountry = data[1][i];
            closestIdx = i;
        }
    }

    // Include the closest match
    if (closestCountry.value > subscriberCount) {
        closestHigherThree.push(closestCountry);
    } else if (closestCountry.value < subscriberCount) {
        closestLowerThree.push(closestCountry);
    }


    // Next lower three population countries are the next three indexes in the sorted array.
    for (let i = 1; i <= 3; i++) {
        const country = data[1][closestIdx + i];
        if(country == undefined) {
            break;
        } else if (closestLowerThree.length < 3) {
            closestLowerThree.push(country);
        }
    }

    // Same but going down.
    for (let i = 1; i <= 3; i++) {
        const country = data[1][closestIdx - i];
        if(country == undefined) {
            break;
        } else if (closestHigherThree.length < 3) {
            closestHigherThree.push(country);
        }
    }

    closestHigherThree.reverse();

    console.dir([closestLowerThree, closestHigherThree]);
    return [closestLowerThree, closestHigherThree];
}


function parseNumber(num) {
    num = parseInt(num);
    let beautified;

    if (num >= 1.0e9) {
        beautified = (num / 1.0e9).toFixed(2) + 'B';
    } else if (num >= 1.0e6) {
        beautified = (num / 1.0e6).toFixed(2) + 'M';
    } else {
        beautified = num.toLocaleString();
    }
    return beautified;
}
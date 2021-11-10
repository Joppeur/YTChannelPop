"use strict;"

console.log(data);
var responseTest;

// Domain restricted API key, also hidden in .gitignore so Google doesn't disable it.
const apiKey = hiddenAPIKey;


window.addEventListener("load", function (e) {
    loadClient();

    let input = document.getElementById('ytchannel');
    let searchButton = document.getElementById('search');
    let results = document.getElementById('results');
    searchButton.addEventListener("click", function () {
        let channelId = parseChannelID(input.value);
        if (channelId) {
            results.hidden = false;
            execute(channelId);
        } else {
            input.setCustomValidity("Wrong Youtube channel URL format")
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
    if(!response.results) {
        console.error('Wrong channel URL format');
    }
    let subscriberCount = response.result.items[0].statistics.subscriberCount;
    let channelName = response.result.items[0].snippet.title;
    console.log(channelName);
    console.log("Subscribers: ", parseNumber(subscriberCount));

    let channelNameEl = document.getElementById('channelName');
    channelNameEl.textContent = channelName;

    let subscriberCountEl = document.getElementById('subscriberCount');
    subscriberCountEl.textContent = parseNumber(subscriberCount);

    let closestCountry = (closestCountryByPop(subscriberCount));

    let countryNameEl = document.getElementById('countryName');
    countryNameEl.textContent = closestCountry.country.value;

    let populationEl = document.getElementById('countryPop');
    populationEl.textContent = parseNumber(closestCountry.value);


}


function closestCountryByPop(subscriberCount) {
    subscriberCount = parseInt(subscriberCount);
    let current = data[1][0];

    for (let i = 0; i < data[1].length; i++) {
        const population = data[1][i].value;
        if (population != null && Math.abs(subscriberCount - population) < Math.abs(subscriberCount - current.value)) {
            current = data[1][i];
        }
    }
    return current;
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
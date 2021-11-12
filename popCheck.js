"use strict;"

console.log(data);
var responseTest;

// Domain restricted API key, also hidden in .gitignore so Google doesn't disable it.
const apiKey = hiddenAPIKey;


window.addEventListener("load", function (e) {
    loadClient();

    let input = document.getElementById('channelInput');
    let searchButton = document.getElementById('search');
    let results = document.getElementById('results');
    searchButton.addEventListener("click", function () {
        let channelId = parseChannelID(input.value);
        if (channelId) {
            input.setCustomValidity("");
            results.style.visibility = 'visible';
            execute(channelId);
        } else {
            input.setCustomValidity("Wrong Youtube channel URL format");
            input.reportValidity();
            input.value = "";
        }
    });

});


function pointChannelAtCountry() {
    let lastHigherCountry = getLastHigherCountry();
    let channel = document.getElementById('channel');
    console.log('halloo');
    console.log(channel);
    let countryLocation = lastHigherCountry.getBoundingClientRect();
    console.log(lastHigherCountry);
    console.log(countryLocation);
    // channel.style.left = countryLocation.left + 'px';
    // channel.style.right = countryLocation.right + 'px';
    // channel.style.top = countryLocation.top + 'px';
    // channel.style.bottom = countryLocation.bottom + 'px';
}

function getLastHigherCountry() {
    let countries = document.getElementById('countryList').childNodes;
    console.log('Jou');
    // console.log(countries);
    let lastHigherCountry;
    for (const node of countries) {
        if (node.className == 'higher') {
            lastHigherCountry = node;
        }
    }
    return lastHigherCountry;
}


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
            pointChannelAtCountry();
        },
            function (err) { console.error("Execute error", err); });
}


// Returns the text after slash or text between two last slashes if string ends with slash
// FIX: Error handling when url = https://www.youtube.com/user/noriyaro
function parseChannelID(channelURL) {
    let string = channelURL.trim();

    if (!channelURL.includes('youtube')) {
        console.error('Wrong channel URL format');
        return null;
    }

    if (string.endsWith('/')) {
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


async function parseResponse(response) {
    let items = response.result.items[0];
    let subscriberCount = items.statistics.subscriberCount;
    let channelName = items.snippet.title;
    console.log(channelName);
    console.log("Subscribers: ", parseNumber(subscriberCount));

    let channelNameEl = document.getElementById('channelName');
    channelNameEl.textContent = channelName;
    let subscriberCountEl = document.getElementById('subscriberCount');
    subscriberCountEl.textContent = parseNumber(subscriberCount);

    let closestCountries = closestCountriesByPop(subscriberCount);
    let countriesEl = document.getElementById('countryList');

    createCountryElementsFromArr(closestCountries[1], countriesEl, true);
    createCountryElementsFromArr(closestCountries[0], countriesEl, false);

    let thumbnailURL = items.snippet.thumbnails.medium.url;
    let img = document.createElement('img');
    img.setAttribute('id', 'thumbnail');
    img.setAttribute('src', thumbnailURL);
    img.setAttribute('alt', 'Thumbnail');
    let channelEl = document.getElementById('channel');
    channelEl.prepend(img);


    return true;
}

function createCountryElementsFromArr(countries, parentElement, higherPop) {
    for (let i = 0; i < countries.length; i++) {
        const country = countries[i];
        let li = document.createElement('li');
        let countryNameEl = document.createElement('span');
        countryNameEl.textContent = country.country.value;
        countryNameEl.setAttribute('class', 'countryName');

        let populationEl = document.createElement('span');
        populationEl.textContent = parseNumber(country.value);
        populationEl.setAttribute('class', 'countryPop');

        li.appendChild(countryNameEl);
        li.appendChild(populationEl);
        // li.style.backgroundColor = 'salmon';
        if (higherPop) {
            li.setAttribute('class', 'higher');
        } else {
            li.setAttribute('class', 'lower');
        }
        parentElement.appendChild(li);
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
        if (country == undefined) {
            break;
        } else if (closestLowerThree.length < 3) {
            closestLowerThree.push(country);
        }
    }

    // Same but going down.
    for (let i = 1; i <= 3; i++) {
        const country = data[1][closestIdx - i];
        if (country == undefined) {
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
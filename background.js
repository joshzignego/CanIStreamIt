/* background.js runs off the "imaginary" background.html page which is useful for manipulating html elements.
 * Interacts with content.js via messages within chrome. */

//The text highlighted by the user
var textSelection = "";

//Null if no link to the site, not null if link to that site
var netflix = "";               //https://www.netflix.com/search?q=the%20office
var hulu = "";                  //https://www.hulu.com/search?q=rick%20and%20morty
var amazon = "";                //https://www.amazon.com/s/ref=nb_sb_noss_1?url=search-alias%3Dinstant-video&field-keywords=mr+robot
var hbo = "";                   //https://play.hbogo.com - no unique url for search

//The title of the top result
var title = "";


// Called when the user clicks on the browser action
chrome.browserAction.onClicked.addListener(function (tab) {
    // Send a message to the active tab
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        var activeTab = tabs[0];
        //Send this message to content.js
        chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
    });
});

// Called when must get availabilities for the selection
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if( request.message === "find_availabilities" ) {
            textSelection = request.selection;
            getAvailabilities();
        }
    }
);

//Get streaming availabilities based on text selection
function getAvailabilities()
{
    //Reset to null from previous time browser action clicked
    netflix = hulu = amazon = hbo = "";

    //If no text selected, send alert to content.js
    if (textSelection.localeCompare("") === 0) {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            var activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {
                "message": "alert",
                "heading": "Highlight text to search the streaming availability of the movie/TV show with the most similar title!",
                "title": "Doesnt matter because won't be displayed",
                "netflix": netflix, "hulu": hulu, "hbo": hbo, "amazon": amazon});
        });
    }

    var url = "https://reelgood.com/search/" + textSelection;

    //Get HTML of https://reelgood.com/search/the%20office or whatever is searched
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {

            //Set html of background.html to be html of the search page
            document.getElementById("shell").innerHTML = xhr.responseText;

            //All html needed exists within this div
            var appmount = document.getElementById("app_mountpoint");

            //Div class names constantly changing, so must get top result's div this way
            var topResult = appmount.childNodes[2].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0];

            //Get link to top search result's own page
            var linkToTopResult = topResult.getAttribute("href");

            var linkToPage = "https://reelgood.com" + linkToTopResult;//url for next page

            //Use for debugging
            //document.getElementById("shell").innerHTML = linkToPage;

            //Get html of second page with streaming info of top result now that we have its url
            request2(linkToPage);
        }
    }
    xhr.send();
}

//Get treaming availabilities based on top search result's html page
function request2(url) {
    var xhr2 = new XMLHttpRequest();
    xhr2.open("GET", url, true);

    xhr2.onreadystatechange = function() {
        if (xhr2.readyState == 4) {

            //Set html of background.html to be html of the result's page
            document.getElementById("shell").innerHTML = xhr2.responseText;

            var appmount = document.getElementById("app_mountpoint");

            //Set title as page's title
            title = appmount.childNodes[2].childNodes[0].childNodes[4].childNodes[1].childNodes[0].innerHTML;


            var streamingOptions = appmount.childNodes[2].childNodes[0].childNodes[4].childNodes[1].childNodes[1].childNodes[3].childNodes[1];

            //Convert html element into a string
            streamingOptions = nodeToString(streamingOptions);

            var heading = "";

            //If streaming option in result's div, update the streaming variable's result
            if (streamingOptions.includes("Hulu"))
                hulu = "Hulu";
            if (streamingOptions.includes("Netflix"))
                netflix = "Netflix";
            if (streamingOptions.includes("HBO"))
                hbo = "HBO Go";
            if (streamingOptions.includes("Amazon"))
                amazon = "Amazon Prime";

            //If no streaming options, update heading
            if (netflix.localeCompare("") === 0 && hulu.localeCompare("") === 0 && hbo.localeCompare("") === 0 && amazon.localeCompare("") === 0)
                heading = title + "\n" + " is not currently available for streaming.";
            else
                heading = title + "\n" + " is streaming on";

            //Send message with results to content.js
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                var activeTab = tabs[0];
                chrome.tabs.sendMessage(activeTab.id, {
                    "message": "alert", "heading": heading, "title": title,
                    "netflix": netflix, "hulu": hulu, "hbo": hbo, "amazon": amazon});
            });
        }
    }
    xhr2.send();
}

//Convert html element into a string
function nodeToString(node) {
    var tempNode = window.document.createElement("div");
    tempNode.appendChild(node.cloneNode(true));
    return tempNode.innerHTML;
}
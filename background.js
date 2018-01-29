/* background.js runs off the "imaginary" background.html page which is useful for manipulating html elements.
 * Interacts with content.js via messages within chrome. */

//The text highlighted by the user
var textSelection = "";

//Null if no link to the site, not null if link to that site
var netflix = "";
var netflixURL = "";            //https://www.netflix.com/search?q=the%20office
var hulu = "";
var huluURL = "";               //https://www.hulu.com/search?q=rick%20and%20morty
var amazon = "";
var amazonURL = "";             //https://www.amazon.com/s/ref=nb_sb_noss_1?url=search-alias%3Dinstant-video&field-keywords=mr+robot
var hbo = "";
var hboURL = "";                //https://play.hbogo.com - no unique url for search

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
    title = netflix = hulu = amazon = hbo = netflixURL = huluURL = amazonURL = hboURL = "";

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

    //A call to the Google JSON/Atom Custom Search API
    var googleURL = "https://www.googleapis.com/customsearch/v1?key=AIzaSyCp4aH-jO9uMyFc-yKV1PdXpOPxGX2eFzc&cx=010725933407033176448:vsl9jyazche&q=" + textSelection;
    //custom search engine: 010725933407033176448:vsl9jyazche  apikey: AIzaSyCp4aH-jO9uMyFc-yKV1PdXpOPxGX2eFzc


    var xhr = new XMLHttpRequest();
    xhr.open("GET", googleURL, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {

            //items has the top 10 search results
            var results = (JSON.parse(xhr.responseText)).items;

            //For debugging
            document.getElementById("shell").innerHTML = xhr.responseText;

            //If an IMDB link exists, use that for the title
            for(var j = 0; j < 10; j++) {
                if (results[j].link.includes("www.imdb.com/title/")) {
                    title = results[j].title.split(" (")[0];
                }
            }

            //Go thru each link & see if it goes to a streaming service
            for(var i = 0; i < 10; i++) {
                if (results[i].link.includes("https://www.netflix.com/title/") && netflix.localeCompare("") === 0) {
                    netflix = "Netflix";
                    netflixURL = results[i].link;

                    if (title.localeCompare("") === 0) {
                        title = results[i].title.split(" | ")[0];
                    }
                }

                if (results[i].link.includes("https://www.hulu.com/") && hulu.localeCompare("") === 0) {
                    hulu = "Hulu";
                    huluURL = results[i].link;

                    if (title.localeCompare("") === 0) {
                        if (results[i].title.includes("Watch") && results[i].title.includes("Online at Hulu")) {

                            //Get text between Watch and Online as title
                            var tempTitle = results[i].title;
                            var regex = /(.*Watch\s+)(.*)(\s+Online.*)/;
                            title = tempTitle.replace(regex, "$2");
                        }
                    }
                }

                if (results[i].link.includes("https://www.amazon.com/") && amazon.localeCompare("") === 0) {
                    amazon = "Amazon Prime";
                    amazonURL = results[i].link;

                    if (title.localeCompare("") === 0) {
                        if (results[i].title.includes("Amazon.com")) {

                            //Get string after Amazon.com
                            var tempTitle = results[i].title;
                            var amzncom = "Amazon.com";
                            title = tempTitle.slice(tempTitle.indexOf(amzncom) + amzncom.length);
                        }
                    }
                }
                if (results[i].link.includes("https://www.hbo.com/") && hbo.localeCompare("") === 0) {
                    hbo = "HBO";
                    hboURL = results[i].link;

                    if (title.localeCompare("") === 0) {
                        title = results[i].title.split(" - ")[0];
                    }
                }
            }

            var heading = "";

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
                    "netflix": netflix, "hulu": hulu, "hbo": hbo, "amazon": amazon,
                    "netflixURL": netflixURL, "huluURL": huluURL, "hboURL": hboURL, "amazonURL": amazonURL
                });
            });
        }
    }
    xhr.send();
}

//Convert html element into a string
function nodeToString(node) {
    var tempNode = window.document.createElement("div");
    tempNode.appendChild(node.cloneNode(true));
    return tempNode.innerHTML;
}
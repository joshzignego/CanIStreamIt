/* content.js can directly interact with the page chrome has open.
 * Interacts with background.js via messages within chrome. */

//Event handler for when messages are sent by background.js
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

        //Get selected text and return to background.js
        if( request.message === "clicked_browser_action" ) {
            var selection = window.getSelection().toString();
            chrome.runtime.sendMessage({"message": "find_availabilities", "selection": selection});
            console.log("Clicked browser action");
        }

        //Display results in alert box
        if( request.message === "alert" ) {
            //Must get urls to logo pngs through chrome, not a direct url
            var netflixPNG_URL = chrome.extension.getURL("logos/netflix.png");
            var huluPNG_URL = chrome.extension.getURL("logos/hulu.png");
            var amazonPNG_URL = chrome.extension.getURL("logos/amazon.png");
            var hboPNG_URL = chrome.extension.getURL("logos/hbo.png");

            // This string will contain the html inside the sweet alert box
            var htmlString = "";

            //If can stream to netflix, add logo & link
            if (request.netflix.localeCompare("") !== 0)
                htmlString += makeHTML("Netflix", "https://www.netflix.com/search?q=" + request.title , netflixPNG_URL);

            //If can stream to hulu, add logo & link
            if (request.hulu.localeCompare("") !== 0)
                htmlString += makeHTML("Hulu", "https://www.hulu.com/search?q=" + request.title, huluPNG_URL);

            //If can stream to amazon prime, add logo & link
            if (request.amazon.localeCompare("") !== 0)
                htmlString += makeHTML("Amazon Prime", "https://www.amazon.com/s/ref=nb_sb_noss_1?url=search-alias%3Dinstant-video&field-keywords=" + request.title, amazonPNG_URL);

            //If can stream to hbo go, add logo & link
            if (request.hbo.localeCompare("") !== 0)
                htmlString += makeHTML("HBO Go", "https://play.hbogo.com", hboPNG_URL);

            //Sweet Alert with request.heading as the header and htmlString as HTML for the body
            swal({
                confirmButtonText: 'Close',
                title: request.heading,
                html: htmlString
            });
        }
    }
);

//Generates html inside sweet alert box to displak links & logos
function makeHTML(site, url, pngURL) {
    return      '<div class="row" style="display: block; clear: both; height: 59px;">' +

                '<div class="column" style="float: left; width: 50%;">' +
                '<img src= "' + pngURL + '" width="114" height="59" style="float: right; padding-right: 20px;">' +
                '</div>' +

                '<div class="column" style="float: left; width: 50%; padding-top: 15px; border: ">' +
                '<a style="float: left; padding-left: 20px;" href="' + url + '" target="_blank" >' + site + '</a>' +
                '</div>' +

                '</div>';
}
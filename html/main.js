/* globals $ */

$(function() {
    
    $("#shorten").on("click", function() {
        window.location.replace("/new/"+$("#urlInput").val());
    });
});


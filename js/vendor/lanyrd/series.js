/*
A stop-gap extension until series are supported in the Lanyrd API - e.g. http://lanyrd.com/series/asyncjs/
Example:

    lanyrd.series('http://lanyrd.com/series/asyncjs/')
        .then(fn);
*/
(function (lanyrd) {
    'use strict';
    
    var LANYRD_WEB_ROOT = 'http://lanyrd.com',
        getJSON = lanyrd.utils.jsonp || (window.jQuery && window.jQuery.getJSON);
        
    // Since this is a temporary extension, back-off if `lanyrd.series` has been integrated into the core library
    if (lanyrd.series){
        return;
    }
    
    // YQL console for this command: http://developer.yahoo.com/yql/console/?q=select%20a.href%2C%20a.content%20from%20data.html.cssselect%20where%20url%3D%22http%3A%2F%2Flanyrd.com%2Fseries%2Fasyncjs%2F%22%20and%20css%3D%22.vevent%20.url%22#h=select%20href%2C%20content%20from%20html%20where%20url%3D%22http%3A//lanyrd.com/series/asyncjs/%22%20and%0A%20%20%20%20%20%20xpath%3D%27//li%5Bcontains%28@class%2C%22vevent%22%29%5D//a%5Bcontains%28@class%2C%22url%22%29%5D%27
    
    function yqlUrl(seriesUrl){
        return "http://query.yahooapis.com/v1/public/yql?q=select%20href%2C%20content%20from%20html%20where%20url%3D%22" +
            encodeURIComponent(seriesUrl) + 
            "%22%20and%0A%20%20%20%20%20%20xpath%3D'%2F%2Fli%5Bcontains(%40class%2C%22vevent%22)%5D%2F%2Fa%5Bcontains(%40class%2C%22url%22)%5D'" +
            "&format=json&callback=?";
    }
    
    lanyrd.series = function(seriesUrl, successCallback, errorCallback){
        var promises = [];

        return getJSON(yqlUrl(seriesUrl))
        .pipe(function(data){
            if (!data.query.results){
                // Assign an array of objects to data.query.results.a if YQL lookup
                // fails and you really need to test.
                return [];
            }
            
            // Transform YQL conference results to full Lanyrd conference Resources

            lanyrd.utils.each(data.query.results.a, function (simpleConference) {
                promises.push(
                    lanyrd.conference(LANYRD_WEB_ROOT + simpleConference.href).fetch()
                );
            });

            return lanyrd.utils.when(promises);
        })
        .done(successCallback)
        .fail(errorCallback);
    };
})(this.lanyrd);

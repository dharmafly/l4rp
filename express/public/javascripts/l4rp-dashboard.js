(function(window, document){
    // LOCATION MAP
    function createLocationMap(){
        var cloudmadeApiKey = '2b0e47feae114fa39f72028297b0e59c',
            popupHtml = 'Lab for the Recently Possible',
        
            /////
    
            map = new L.Map('map', {scrollWheelZoom: false}),
            cloudmade = new L.TileLayer('http://{s}.tile.cloudmade.com/' + cloudmadeApiKey + '/997/256/{z}/{x}/{y}.png', {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
                maxZoom: 18
            }),
            marker = new L.Marker(new L.LatLng(50.83337,-0.16400));

        map.addLayer(cloudmade)
           .setView(new L.LatLng(50.83337,-0.16400), 16)
           .addLayer(marker);

        // attach a given HTML content to the marker and immediately open it
        marker.bindPopup(popupHtml).openPopup();
    }
    
    function setupLocationMap(){
        cmd('http://code.leafletjs.com/leaflet-0.3.1/leaflet.js', createLocationMap);
    }
    
    
    /////
    
    // LANYRD
    
    function createNextEventWidget(){
        var nextEvent = document.getElementById('next-event'),
            eventLink = document.getElementById('next-event-url'),
            intervalDelay = 618,
            intervalRef, lanyrdWidget;
            
        if (window.lanyrd && nextEvent && eventLink){
            intervalRef = window.setInterval(function(){
                eventLink.textContent += ".";
            }, intervalDelay);
                
            lanyrdWidget = lanyrd.widget.people(eventLink.href, nextEvent, {append: true});
                
            lanyrdWidget
                .always(function(){
                    window.clearInterval(intervalRef);
                    intervalRef = null;
                })
                .fail(function(){
                    eventLink.textContent += "!";
                });
        }
        
        return lanyrdWidget;
    }
    
    function getUpcomingEvents(profileUrl){
        var person = lanyrd.person(profileUrl),
            now  = new Date().getTime();
                        
        return person.fetch()
            .pipe(function(){
                //console.log(person.get('user'));
                return person.related('user.attending')
                    .all()
                    .fetch()
                    .pipe(function(attending) {
                        return attending
                            .collection('conferences_attending')
                            .filter(function (conf) {
                                return Date.parse(conf.start_date) >= now;
                        });
                    });
            
                });
    }
    
    function enhanceLanyrdWidget(lanyrdWidget){
        lanyrdWidget.done(function(){
            if (document.querySelectorAll && document.addEventListener){
                    lanyrd.utils.each(document.querySelectorAll('.lanyrd-people a'), function(profileLink){
                        var profileUrl = profileLink.href;
                        profileLink.addEventListener('click', function(event){
                                getUpcomingEvents(profileUrl)
                                    .done(function(conferences){
                                        if (conferences.length){
                                            console.log(conferences);
                                        }
 });
                                    event.preventDefault();
                        }, false);
        })
            }
        });
    }
    
    function setupLanyrd(){
        cmd('javascripts/vendor/lanyrd/lanyrd.min.js', 'javascripts/vendor/lanyrd/lanyrd-widget.min.js', createNextEventWidget);
    }
    
    
    /////
    
    // FLICKR
    function setupFlickr(){
        var target = document.getElementById('flickr-widget'),
            loader, source;
            
        target.innerHTML = "<img alt='Loading...' src='images/flickr-spinner.gif' width='16' height='8'>";
        
        // TEMP
        document.write('<script id="flickr-loader" src="http://www.flickr.com/badge_code_v2.gne?count=10&size=m&layout=x&source=all_tag&tag=L4RP"><script>');
        loader = document.getElementById('flickr-loader');
        source = loader.nextSibling;
        target.innerHTML = '';
        
        if (source){
            target.innerHTML = source.innerHTML;
            loader.parentNode.removeChild(loader);
            source.parentNode.removeChild(source);
        }
    }
    function setupFlickrTemp(){
        var target = document.getElementById('flickr-widget');
        target.innerHTML = "<img alt='Loading...' src='images/flickr-spinner.gif' width='16' height='8'>";
    }
    
    /////
    
    
    // ANALYTICS
    function setupAnalytics(){
        var _gaq = window._gaq || (window._gaq = []),
        gaUrl = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js'
        
        _gaq.push(['_setAccount', 'UA-2150808-20']);
        _gaq.push(['_trackPageview']);
        
        cmd(gaUrl);
    }
    
    
    /////
    
    
    // GO!
    setupLocationMap();
    setupLanyrd();
    //setupFlickr();
    setupFlickrTemp();
    setupAnalytics();

}(window, document));
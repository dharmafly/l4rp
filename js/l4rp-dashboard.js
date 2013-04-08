(function(window, document, cmd){
    'use strict';

    // LOCATION MAP
    function createLocationMap(){
        var cloudmadeApiKey = '2b0e47feae114fa39f72028297b0e59c',
            popupHtml = 'Lab for the Recently Possible, <br>45 Gloucester Street',
        
            /////

            L = window.L,
            map = new L.Map('map', {scrollWheelZoom: false}),
            cloudmade = new L.TileLayer('http://{s}.tile.cloudmade.com/' + cloudmadeApiKey + '/997/256/{z}/{x}/{y}.png', {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
                maxZoom: 18
            }),
            marker = new L.Marker(new L.LatLng(50.827006,-0.136063));

        map.addLayer(cloudmade)
           .setView(new L.LatLng(50.827006,-0.136063), 16)
           .addLayer(marker);

        // attach a given HTML content to the marker and immediately open it
        marker.bindPopup(popupHtml).openPopup();
    }
    
    function setupLocationMap(){
        if (window.location.search.indexOf('offline') === -1){
            cmd('http://cdn.leafletjs.com/leaflet-0.3.1/leaflet.js', createLocationMap);
        }
    }
    
    
    /////
    
    // LANYRD

    function createWidgets() {
        var nextEvent = document.getElementById('next-event'),
            nextEventLink = document.getElementById('next-event-url'),
            dataVis = document.getElementById('data-vis-attendees'),
            gameLab = document.getElementById('game-lab-attendees'),
            dataVisEvents = [
                'http://lanyrd.com/2012/l4rp-dv1/',
                'http://lanyrd.com/2012/l4rp-dv2/',
                'http://lanyrd.com/2012/l4rp-dv3/'
            ],
            dataVisOptions = {
                append: false, 
                templates: {
                    attendeesHeading: '<h2 class="lanyrd-attendees-title">{{amount}} attending</h2>'
                }
            };

        if (nextEventLink){
            createEventWidget(nextEvent, nextEventLink, nextEventLink.href, {append: true});
        }
        if (dataVis){
            createEventWidget(dataVis, dataVis, dataVisEvents, dataVisOptions);
        }
        if (gameLab){
            createEventWidget(gameLab, gameLab, 'http://lanyrd.com/2012/gamelabbrighton-august/', {append: false});
        }
    }

    function createEventWidget(element, loadingElement, eventHref, options) {
        var intervalDelay = 618,
            intervalRef, lanyrdWidget,
            lanyrd = window.lanyrd;

        if (lanyrd && element && loadingElement) {
            intervalRef = window.setInterval(function(){
                loadingElement.textContent += ".";
            }, intervalDelay);

            lanyrdWidget = lanyrd.widgets.people(eventHref, element, options);
                
            lanyrdWidget
                .always(function(){
                    window.clearInterval(intervalRef);
                    intervalRef = null;
                })
                .fail(function(){
                    loadingElement.textContent += "!";
                });
        }

        return lanyrdWidget;
    }
    
    /*
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
    */

    /*
    function enhanceLanyrdWidget(lanyrdWidget){
        lanyrdWidget.done(function(){
            if (document.querySelectorAll && document.addEventListener){
                lanyrd.utils.each(document.querySelectorAll('.lanyrd-people a'), function(profileLink){
                    var profileUrl = profileLink.href;
                    profileLink.addEventListener('click', function(event){
                        getUpcomingEvents(profileUrl);
                        event.preventDefault();
                    }, false);
                });
            }
        });
    }
    */
    
    function setupLanyrd(){
        cmd(
            'http://code.jquery.com/jquery-1.7.1.min.js',
            'js/vendor/lanyrd/lanyrd-jquery-ext-v0.2.0.min.js?v3',
            createWidgets
        );
    }
    
    
    /////
    
    // FLICKR
    /*
    function setupFlickr(){
        var target = document.getElementById('flickr-widget'),
            loader, source;
            
        target.innerHTML = "<img class='loading' alt='Loading...' src='images/flickr-spinner.gif' width='16' height='8'>";
        
        // TEMP
        document.write('<script id="flickr-loader" src="http://www.flickr.com/badge_code_v2.gne?count=20&size=m&layout=x&source=all_tag&tag=L4RP"><script>');
        loader = document.getElementById('flickr-loader');
        source = loader.nextSibling;
        target.innerHTML = '';
        
        if (source){
            target.innerHTML = source.innerHTML;
            loader.parentNode.removeChild(loader);
            source.parentNode.removeChild(source);
        }
    }
    */
    function setupFlickrTemp(){
        var target = document.getElementById('flickr-widget');
        target.innerHTML = "<img class='loading' alt='Loading...' src='images/flickr-spinner.gif' width='16' height='8'>";
    }
    
    /////
    
    
    // ANALYTICS
    function setupAnalytics(){
        var _gaq = window._gaq || (window._gaq = []),
        gaUrl = ('https:' === document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
        
        _gaq.push(['_setAccount', 'UA-2150808-20']);
        _gaq.push(['_trackPageview']);
        
        cmd(gaUrl);
    }
    
    
    /////
    
    
    // GO
    //setupCredits();
    setupLocationMap();
    setupLanyrd();
    //setupFlickr();
    setupFlickrTemp();
    setupAnalytics();

}(this, this.document, this.cmd));
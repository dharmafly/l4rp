(function(window, document){

    function createWidgets () {
        var dataVis = document.getElementById('data-vis-attendees'),
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

        if (dataVis){
            dataVis.textContent = "Getting Attendees...";
            createEventWidget(dataVis, dataVis, dataVisEvents, dataVisOptions);
            dataVis.style.display = "block";
        }
    }

    function createEventWidget(element, loadingElement, eventHref, options) {
        var intervalDelay = 618,
            intervalRef, lanyrdWidget;

        if (window.lanyrd && element && loadingElement) {
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
    
    function setupLanyrd(){
        var windowSearch = window.location.search,
            devMode = /^\?dev[\W\/]?/.test(windowSearch),
            ext = devMode ? '.js' : '.min.js';

        cmd(
            'jquery/jquery-1.7.2.min.js',
            'lanyrd/lanyrd-jquery-ext-v0.2.0' + ext + '?v3',
            createWidgets,
            {path:'../js/vendor/'}
        );
    }

    // ANALYTICS
    function setupAnalytics () {
        var _gaq = window._gaq || (window._gaq = []),
        gaUrl = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js'
        
        _gaq.push(['_setAccount', 'UA-2150808-20']);
        _gaq.push(['_trackPageview']);
        
        cmd(gaUrl);
    }
    
    
    /////
    
    
    // GO!
    setupLanyrd();
    setupAnalytics();
    
}(window, document));
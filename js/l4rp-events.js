(function(window, document){

    /////
    
    // LANYRD
    
    function createSeriesWidget(){
        var eventsWrapper = document.getElementById('events-wrapper'),
            lanyrdWidget,
            options,
            loadingIndicator;

        if (window.lanyrd && eventsWrapper) {

            loadingIndicator = loadingDots(eventsWrapper);

            options = {
                templates: {
                    wrapper:'<div class="lanyrd-series">{{content}}</div>',
                    upcoming:'<section class="lanyrd-series-upcoming"><h3>Upcoming Events</h3>' +
                    '<div>{{conferences}}</div></section>',
                    upcomingConference:'<section class="lanyrd-series-upcoming-conference callout"><h1>' + 
                    '<a href="{{web_url}}">{{name}}</a></h1><div class="date-icon"></div>' +
                    '<p class="lanyrd-series-date"><time datetime="{{end_date}}"><strong>{{dates}}</strong></time></p>' +
                    '<p>{{tagline}}</p><p><a href="{{web_url}}">&raquo; Read more & sign up on Lanyrd</a>' +
                    '</p><ul class="lanyrd-series-topics"></ul>' +
                    '<div class="lanyrd-series-attending"></div></section>',
                    past:'<div class="lanyrd-series-past"><h3>Past Events</h3><dl>{{conferences}}</dl></div>',
                    pastConference:'<dt class="lanyrd-series-past-conference">' +
                    '<a title="{{tagline}}" href="{{web_url}}">{{name}}</a></dt>' +
                    '<dd><em>{{dates}}</em> &mdash; {{tagline}}</dd>'
                }
            };

            lanyrdWidget = lanyrd.widgets.series('http://lanyrd.com/series/l4rp/', eventsWrapper, options);

            lanyrdWidget.always(function(){

                loadingIndicator.stop();

            }).done(function (html, conferences) {

                var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

                // prepend the day of the week to the date
                $('.lanyrd-series-date').find('time').each(function (i, val) {
                    var d = new Date($(this).attr('datetime'));
                    $(this).html('<strong>' + days[d.getDay()] + ' ' + $(this).text() + '</strong>');
                });

                // Load the people widgets
                $('.lanyrd-series-attending').each(function (i, val) {
                    var $link   = $(this).siblings('p').children('a'),
                        href    = $link.attr('href'),
                        dots    = loadingDots($link[0], {reset:true,interval:600}),
                        options = {
                            append: true,
                            attendeesHeadingTemplate: '<h2 class="lanyrd-attendees-title">{{amount}} attending</h2>',
                            trackersHeadingTemplate: '<h2 class="lanyrd-trackers-title">{{amount}} tracking</h2>',
                        };

                    lanyrd.widgets.people(href, this, options).done(function () {
                        dots.stop();
                    });
                });

                $('.date-icon').each(function (i, val) {
                    var datetime = $(this).siblings('.lanyrd-series-date').find('time').attr('datetime');
                    dateIcon(datetime, this);
                });

                // build and render the topics for each conference
                $('.lanyrd-series-topics').each(function (i, val) {
                    var conference,
                        $list = $(this),
                        href = $list.siblings('h1').find('a').attr('href');

                    // get the conference object for this topics list
                    for (var i = 0; i < conferences.length; i++) {
                        if (conferences[i].conference.web_url === href) {
                            conference = conferences[i].conference;
                            break;
                        }
                    };

                    // render the topics list
                    $.each(conference.topics, function (i, val) {
                        $list.append('<li><a href="' + val.web_url + '">' + val.name + '</a></li>');
                    });
                });
            });
        }
    }

    function dateIcon(datetime, element) {
        var date = new Date(datetime),
            months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],
            icon = document.createElement('div');

        icon.className = 'date-icon';

        icon.innerHTML = '<div>' + months[date.getMonth()] + 
        '</div><div>' + date.getDate() + 
        '</div><div>' + date.getFullYear() + 
        '</div>';
        
        element.parentNode.replaceChild(icon, element);

        return icon;
    }

    function loadingDots(element, options) {
        var options = options || {},
            intervalDelay = options.interval || 450,
            original = element.textContent,
            reset = options.reset || false,
            intervalRef;

        intervalRef = window.setInterval(function(){
            element.textContent += ".";
        }, intervalDelay);

        return {
            stop: function () {
                window.clearInterval(intervalRef);
                intervalRef = null;
                if (reset) element.textContent = original;
            }
        }
    }
    
    function setupLanyrd(){
        var rootDir = '../js/vendor/lanyrd/',
            windowSearch = window.location.search,
            devMode = /^\?dev[\W\/]?/.test(windowSearch),
            ext = devMode ? '.js' : '.min.js';

        cmd(rootDir + 'lanyrd-jquery-v0.0.1' + ext,
            rootDir + 'series' + ext, 
            rootDir + 'merge' + ext,
            rootDir + 'topics' + ext,
            rootDir + 'widgets' + ext,
            createSeriesWidget
        );
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
    setupLanyrd();
    setupAnalytics();

}(window, document));
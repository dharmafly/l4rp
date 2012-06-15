(function(window, document){

    /////

    // ATOM DATE


    function atomdate(a){return typeof a=="string"?function(b){var c,d,e;return b=b.replace(/z$/i,"+00:00"),c=b.split(/[\-T:+]/),
    d=Number,c.length!==8?!1:(e=b.substr(19,1),new Date(Date.UTC(d(c[0]),d(c[1]-1),d(c[2]),d(c[3]-d(e+c[6])),d(c[4]-d(e+c[7])),
    d(c[5]))))}(a):function(b){function c(a){return String(a).length>1?a:"0"+a}function d(a){var b=0-a.getTimezoneOffset(),
    d=b<0?"-":"+",e=Math.abs(b);return e?d+c(Math.floor(e/60))+":"+c(e%60):"z"}return b.getFullYear()+"-"+c(b.getMonth()+1)+
    "-"+c(b.getDate())+"T"+c(b.getHours())+":"+c(b.getMinutes())+":"+c(b.getSeconds())+d(b)}(a)};


    /////
    
    // LANYRD
    
    function createSeriesWidget(){
        var eventsWrapper = document.getElementById('events-wrapper'),
            lanyrdWidget,
            options,
            loadingIndicator;

        if (window.lanyrd && eventsWrapper) {

            eventsWrapper.textContent = "Loading...";

            loadingIndicator = loadingDots(eventsWrapper);

            options = {
                templates: {
                    wrapper:'<div class="lanyrd-series">{{content}}</div>',
                    upcoming:'<section class="lanyrd-series-upcoming"><h3>Upcoming Events</h3>' +
                    '<div>{{conferences}}</div></section>',
                    upcomingConference:'<section class="lanyrd-series-upcoming-conference callout">' + 
                    '<time datetime="{{start_date}}" class="event-start-date">{{dates}}</time>' +
                    '<h1><a href="{{web_url}}">{{name}}</a></h1>' +
                    '<p>{{tagline}}</p><p><a href="{{web_url}}">&raquo; Read more & sign up on Lanyrd</a>' +
                    '</p><ul class="lanyrd-series-topics"></ul>' +
                    '<div class="lanyrd-series-attending"></div></section>',
                    past:'<div class="lanyrd-series-past"><h3>Past Events</h3><div>{{conferences}}</div></div>',
                    pastConference:'<section class="lanyrd-series-past-conference callout">' +
                    '<time datetime="{{start_date}}" class="event-start-date">{{dates}}</time>' +
                    '<h1><a title="{{tagline}}" href="{{web_url}}">{{name}}</a></h1>' +
                    //'<p><a class="series-past-more-info" href="{{web_url}}">&raquo; More Info</a></p>' +
                    '<div class="lanyrd-series-more-info"></div></section>',
                    error:'Oops. We couldn\'t load those details just now.'
                }
            };

            lanyrdWidget = lanyrd.widgets.series('http://lanyrd.com/series/l4rp/', eventsWrapper, options);

            lanyrdWidget.always(function(){

                loadingIndicator.stop();

            }).done(function (html, conferences) {

                $('.event-start-date').each(function (i, val) {
                    var datetime = $(this).attr('datetime');
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
            });
        }
    }

    function dateIcon(datetime, element) {
        var date = atomdate(datetime + "T00:00:00.000Z"),
            months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],
            days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
            icon = document.createElement('time');

        icon.datetime = datetime;
        icon.className = 'event-start-date';
        icon.title = days[date.getDay()] + ', ' + element.textContent;

        icon.innerHTML = 
        '<abbr class="month">' + months[date.getMonth()] + '</abbr>' +
        '<span class="day">' + date.getDate() + '</span>' +
        '<span class="year">' + date.getFullYear() + '</span>';
        
        element.parentNode.replaceChild(icon, element);

        return icon;
    }

    function loadingDots(element, options) {
        var options = options || {},
            intervalDelay = options.interval || 450,
            original = element.textContent,
            reset = options.reset || false,
            dotCount = 0,
            dotLimit = 10,
            intervalRef;

        intervalRef = window.setInterval(function(){
            element.textContent += ".";
            
            if (dotCount > dotLimit) {
                element.textContent = original + ".";
                dotCount = 1;
            } else {
                dotCount++;
            }
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

        cmd(rootDir + 'lanyrd-jquery-ext-v0.0.1' + ext + '?v2', createSeriesWidget);
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
(function(window, document){

    /////

    // ATOM DATE
    // Source: https://github.com/premasagar/mishmash/tree/master/atomdate

    function atomdate(a){return typeof a=="string"?function(b){var c,d,e;return b=b.replace(/z$/i,"+00:00"),c=b.split(/[\-T:+]/),
    d=Number,c.length!==8?!1:(e=b.substr(19,1),new Date(Date.UTC(d(c[0]),d(c[1]-1),d(c[2]),d(c[3]-d(e+c[6])),d(c[4]-d(e+c[7])),
    d(c[5]))))}(a):function(b){function c(a){return String(a).length>1?a:"0"+a}function d(a){var b=0-a.getTimezoneOffset(),
    d=b<0?"-":"+",e=Math.abs(b);return e?d+c(Math.floor(e/60))+":"+c(e%60):"z"}return b.getFullYear()+"-"+c(b.getMonth()+1)+
    "-"+c(b.getDate())+"T"+c(b.getHours())+":"+c(b.getMinutes())+":"+c(b.getSeconds())+d(b)}(a)};


    /////
    
    // LANYRD
    
    function createSeriesWidget(){
        var noodleBaseUrl = 'http://dharmafly.noodle.jit.su/?q=',
            eventsWrapper = document.getElementById('events-wrapper'),
            lanyrdWidget, options, loadingIndicator, conferenceTemplate;

        function addMetadata(html, conferences) {
            // render the date icon for each event
            $('.event-start-date').each(function (i, val) {
                var datetime = $(this).attr('datetime');
                dateIcon(datetime, this);
            });

            // request the time of each event
            var $timeElements = $('.lanyrd-series-time'),
                times = [],
                query, url;

            $timeElements.each(function (i, val) {
                var url = $(this).parent().find('h1 a').attr('href');
                if (url){
                    times.push({
                        url: url,
                        selector: '.dtstart .time',
                        extract: 'text'
                    });
                }
            });

            query = encodeURIComponent(JSON.stringify(times));
            url = noodleBaseUrl + query + '&callback=?';

            $.getJSON(url, function (data) {
                if (data){
                    $timeElements.each(function (i, val) {
                        if (data[i].results && data[i].results.length) {
                            $(this).text(data[i].results[0].text);
                        }
                    });
                }
            });

            // build and render the topics for each conference
            $('.lanyrd-series-topics').each(function (i, val) {
                var $list = $(this),
                    url = $list.parent().find('h1 a').eq(0).attr('href'),
                    topicsHtml = '',
                    conference, i, len;

                // get the conference object for this topics list
                for (i=0, len = conferences.length; i < len; i++) {
                    if (conferences[i].conference.web_url === url) {
                        conference = conferences[i].conference;

                        if (conference.topics){
                            $.each(conference.topics, function (i, val) {
                                topicsHtml += '<li><a href="' + val.web_url + '">' + val.name + '</a></li>';
                            });
                        }
                    }
                }
                if (topicsHtml){
                    $list.append(topicsHtml);
                }
            });

            // Get event description
            var $descElements = $('.description'),
                descs = [],
                query, url;

            $descElements.each(function (i, val) {
                var url = $(this).parent().find('h1 a').attr('href');
                if (url){
                    descs.push({
                        url: url,
                        selector: '#event-description',
                        extract: 'html'
                    });
                }
            });

            query = encodeURIComponent(JSON.stringify(descs));
            url = noodleBaseUrl + query + '&callback=?';

            $.getJSON(url, function (data) {
                if (data){
                    $descElements.each(function (i, val) {
                        if (data[i].results && data[i].results.length) {
                            $(this).append(data[i].results[0].html);
                        }
                    });
                }
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
        }

        if (!window.lanyrd || !eventsWrapper) {
            return;
        }

        eventsWrapper.textContent = "Loading...";

        loadingIndicator = loadingDots(eventsWrapper);

        conferenceTemplate = '<header>' +
                '<time datetime="{{start_date}}" class="event-start-date">{{dates}}</time>' +
                '<h1><a href="{{web_url}}">{{name}}</a></h1>' +
            '</header>' +
            '<p class="lanyrd-series-time"></p>' +
            '<p class="summary">{{tagline}}</p>' +
            '<p><a class="track" href="{{web_url}}">Read more / sign up</a></p>' +
            '<section class="description"></section>' +
            '<ul class="lanyrd-series-topics"></ul>' +
            '<div class="lanyrd-series-attending"></div>';

        options = {
            templates: {
                wrapper: '<div class="lanyrd-series">{{content}}</div>',

                upcoming: '<section class="lanyrd-series-upcoming">' +
                    '<h1 class="series">Upcoming Events...</h1>' +
                    '<div>{{conferences}}</div>' + 
                '</section>',

                upcomingConference: '<section id="event-{{slug}}" class="event lanyrd-series-upcoming-conference">' + conferenceTemplate + '</section>',

                past: '<section class="lanyrd-series-past"><h1 class="series">Past Events...</h1>' +
                '<div>{{conferences}}</div></section>',

                pastConference: '<section id="event-{{slug}}" class="event lanyrd-series-past-conference">' + conferenceTemplate + '</section>',

                error:'Oops. We couldn\'t load the details just now.'
            }
        };

        lanyrdWidget = lanyrd.widgets.series('http://lanyrd.com/series/l4rp/', eventsWrapper, options);

        lanyrdWidget.always(function(){
            loadingIndicator.stop();
        }).done(addMetadata);
    }

    function dateIcon(datetime, element) {
        var date = atomdate(datetime + "T00:00:00.000Z"),
            months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],
            days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
            icon = document.createElement('time');

        icon.setAttribute('datetime', datetime);
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
        var windowSearch = window.location.search,
            devMode = /^\?dev[\W\/]?/.test(windowSearch),
            ext = devMode ? '.js' : '.min.js';

        cmd(
            'http://code.jquery.com/jquery-1.7.1.min.js',
            '../js/vendor/lanyrd/lanyrd-jquery-ext-v0.2.0' + ext + '?v3',
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
(function(window, document, cmd){
    'use strict';

    if (!cmd){
        return;
    }

    var l4rpDomain = 'l4rp.com';


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
    
    function lanyrdSeriesWidget(){
        var noodleBaseUrl = 'http://dharmafly.noodle.jit.su/?q=',
            eventsWrapper = document.getElementById('events-wrapper'),
            lanyrd = window.lanyrd,
            $ = window.jQuery,
            lanyrdWidget, options, loadingIndicator, conferenceTemplate;

        function addMetadata(html, conferences) {
            // render the date icon for each event
            $('.event-start-date').each(function (i, el) {
                var datetime = $(this).attr('datetime');
                dateIcon(datetime, this);
            });

            // request the time of each event
            (function(){
                var $timeElements = $('.lanyrd-series-time'),
                    times = [],
                    query, url;

                $timeElements.each(function (i, el) {
                    var url = $(this).parent().find('h1 a').attr('href');
                    if (url){
                        times.push({
                            url: url,
                            selector: '.dtstart .time',
                            extract: 'text'
                        });
                    }
                });

                if (times.length){
                    query = encodeURIComponent(JSON.stringify(times));
                    url = noodleBaseUrl + query + '&callback=?';

                    $.getJSON(url, function (data) {
                        if (data){
                            $timeElements.each(function (i, el) {
                                if (data[i].results && data[i].results.length) {
                                    $(this).text(data[i].results[0].text);
                                }
                            });
                        }
                    });
                }
            }());

            var topAndTail = /https?:\/\/(?:www)?|\/$/g;

            function isL4rpRootUrl(url){
                return url
                    .toLowerCase()
                    .replace(topAndTail, '') === l4rpDomain;
            }

            function findConference(conferences, lanyrdUrl){
                var i, len, conference;

                for (i=0, len = conferences.length; i < len; i++) {
                    conference = conferences[i].conference;
                    if (conference.web_url === lanyrdUrl){
                        return conference;
                    }
                }
            }

            // build and render topics, etc for each conference
            $('.lanyrd-series-topics').each(function (i, el) {
                var $list = $(this),
                    lanyrdUrl = $list.parent().find('h1 a').eq(0).attr('href'),
                    topicsHtml = '',
                    conference = findConference(conferences, lanyrdUrl);
                
                if (conference){
                    $.each(conference.topics, function (i, val) {
                        topicsHtml += '<li><a href="' + val.web_url + '">' + val.name + '</a></li>';
                    });
                    
                    if (topicsHtml){
                        $list.append(topicsHtml);
                    }
                }
            });

            // Get event description
            (function(){
                var $descElements = $('.description'),
                    descs = [],
                    query, url;

                $descElements.each(function (i, val) {
                    var lanyrdUrl = $(this).parent().find('h1 a').attr('href');
                    if (url){
                        descs.push({
                            url: lanyrdUrl,
                            selector: '#event-description',
                            extract: 'html'
                        });
                    }
                });

                if (descs.length){
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
                }
            }());


            // Load the people widgets
            $('.lanyrd-series-attending').each(function (i, val) {
                var $link   = $(this).siblings('p').children('a'),
                    href    = $link.attr('href'),
                    dots    = loadingDots($link[0], {reset:true,interval:600}),
                    options = {
                        append: true,
                        attendeesHeadingTemplate: '<h2 class="lanyrd-attendees-title">{{amount}} attending</h2>',
                        trackersHeadingTemplate: '<h2 class="lanyrd-trackers-title">{{amount}} tracking</h2>'
                    };

                lanyrd.widgets.people(href, this, options).done(function () {
                    dots.stop();
                });
            });

            // Do this last: update links to specific site
            $('.event header h1 a').each(function(i, el){
                var conference = findConference(conferences, el.getAttribute('href'));

                // Update URLs if more specific one available
                if (conference && conference.url && !isL4rpRootUrl(conference.url)){
                    el.setAttribute('href', conference.url);
                }
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
            days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
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
        options = options || {};

        var intervalDelay = options.interval || 450,
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
                if (reset) {
                    element.textContent = original;
                }
            }
        }
    }
    
    
    /////

    // Init
    cmd(L4RP.scripts.jquery, L4RP.scripts.lanyrd, lanyrdSeriesWidget);

}(this, this.document, this.cmd));
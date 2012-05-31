/*
    Lanyrd widget. An extension on top of the Lanyrd API.
*/

(function(lanyrd){
    'use strict';

    // Extend the lanyrd global with `lanyrd.widget`

    lanyrd.widgets = {
        people : {},
        person : {}
    };

    // Tim (a tiny, secure JavaScript micro-templating script)
    // https://github.com/premasagar/tim

    var tim = function(){var e=/{{\s*([a-z0-9_][\\.a-z0-9_]*)\s*}}/gi;return function(f,g){return f.replace(e,function(h,i){for(var c=i.split("."),d=c.length,b=g,a=0;a<d;a++){b=b[c[a]];if(b===void 0)throw"tim: '"+c[a]+"' not found in "+h;if(a===d-1)return b}})}}();


    // # Here be Widgets !
    //
    // Widgets are extensions build upon the Lanyrd.js Lanyrd API wrapper.
    //
    // Widgets are self contained within their own namespaces. If you only 
    // need to make use of one then you are free to remove the rest of the 
    // widgets.
    //
    // The structure of each widget contains a process to gather the related 
    // Lanyrd API resources based on optional parameters. Each widget has a 
    // unique internal render function which creates a HTML string.
    //
    // Widgets are consistent in that their signature as they accept a Lanyrd  
    // resource url, and an optional DOM Element and options parameters.
    //
    // All widgets are promises which upon their resolution return the widget 
    // HTML. 
    //
    // ## Customizable templates
    //
    // Each widget aims to accept templates from the user. Templates  
    // are generated internally by Premasagar's [tim](https://github.com/premasagar/tim) 
    // micro-templating library.


    // ### people widget
    //
    // Returns a promise which upon resolution passes a html string with markup describing  
    // the avatars of conference(s) attendees and trackers.
    //
    // `lanyrd.widget.people('http://lanyrd.com/profile/chrisnewtn/', document.body)`
    //
    // #### parameters:
    // - url:           A lanyrd conference url or an array of lanyrd conference urls.
    //
    // - elem:          An optional html dom element which will be populated with the rendered
    //                  html template. The html is passed to the promise resolution
    //                  callback.
    //
    // - options:       Object of key value pairs detailing lower level parameters
    //
    //  - all:          Flag (false by default) which determines how many trackers/attendees
    //                  will be displayed.
    //
    //  - append:       Flag (false by default) for determining how the rendered html template 
    //                  is inserted into the provided dom element. If false any html in the 
    //                  supplied dom element will be overwritten.
    //
    //  - headingLevel  Number which decides what heading level tags the rendered html
    //                  should use. (2 by default) -- revise template as options

    lanyrd.widgets.people = function(url, elem, options) {
        var promise,
            conference,
            options = options || {};
            options.all = options.all || true;
            options.headingLevel = options.headingLevel || 2;

        if(lanyrd.utils.isArray(url) && url.length > 1){

            // Get all attendees and trackers for merged lanyrd conference events
            // 1. Convert passed urls to equivalent Lanyrd api resource objects
            // 2. Pass merged attendees and trackers to render and return render's
            //    promise.

            url = lanyrd.utils.map(url, function(url){
                return lanyrd.conference(url).fetch();
            });

            promise = lanyrd.mergeRelated(url, {related: ['attendees', 'trackers']})
                      .pipe(function(merged){
                          return render(merged.attendees, merged.trackers)
                          .then(tryPlaceInElement);
                      });
        } else {

            // Get attendees and trackers for a lanyrd conference event
            // 1. Change single item array as string
            // 2. Fetch conference data
            // 3. Get related attendees and trackers
            // 4. Pass attendees and trackers to render and return render's
            //   promise.

            url += '';
            promise = lanyrd.conference(url).fetch()
                      .pipe(function(con){
                          conference = con.get('conference');
                          return con;
                      })
                      .pipe(getAttendeesTrackers)
                      .pipe(function(attendees, trackers){
                          return render(
                              attendees.get('attendees'),
                              trackers.get('trackers')
                          )
                          .then(tryPlaceInElement);
                      });
        }

        // Returns a promise representing the retrieval of both the attendees
        // and the trackers. The amount of attendees/trackers passed to the
        // promise resolution is dependant on the options.all parameter.

        function getAttendeesTrackers(con) {
            if(options.all){
                return lanyrd.utils.when(
                    con.related('conference.attendees').all(),
                    con.related('conference.trackers').all()
                )
            } else {
                return lanyrd.utils.when(
                    con.related('conference.attendees').fetch(),
                    con.related('conference.trackers').fetch()
                );
            }
        }

        // Places the generated html in the supplied html dom element
        // (if given).

        function tryPlaceInElement(html) {
            if(elem){
                if(options.append){
                    elem.innerHTML += html;
                } else {
                    elem.innerHTML = html;
                }
            }
        }

        // A render function unique to lanyrd.widget.people

        function render(attendees, trackers){
            var deferred = lanyrd.utils.deferred(),
                promise = deferred.promise(),
                attendeesHeadingTemplate = options.attendeesHeadingTemplate || '<h4 class="lanyrd-attendees-title"> {{amount}} attending</h4>',
                trackersHeadingTemplate = options.trackersHeadingTemplate || '<h4 class="lanyrd-trackers-title"> {{amount}} tracking</h4>',
                peopleTemplate = options.peopleTemplate || '<ul class="lanyrd-people {{peopleType}}">{{list}}</ul>',
                personTemplate = options.personTemplate || '<li><a href="{{web_url}}"><img class="lanyrd-avatar" title="{{name}} ({{username}})" src="{{avatar_url}}"></a></li>',
                html = '';

            // returns attendees and trackers markup

            var drawList = function (people, peopleType) {
                var builtUpTemplate = '',
                    person,
                    i = 0;

                for(i; i < people.length; i++){
                    person = people[i].user || people[i];
                    builtUpTemplate += tim(personTemplate, person);
                }
                html += tim(peopleTemplate, {list: builtUpTemplate, peopleType: peopleType});
            };

            // Build the rest of the template
            // (!) Needs cleanup!
            // Only 'see more attendees' link supported on single conferences (no merged events)

            // Attendees heading
            html += tim(attendeesHeadingTemplate, {amount: attendees.length});

            // Attendee avatars
            drawList(attendees, 'lanyrd-attendees');

            // Provide conference link to conferences
            if(conference){
                html += tim('<p><a target="_blank" href={{web_url}}'+'attendees/'+'>&rarr; Attendee details</a></p>', conference);
            }

            if(trackers.length > 0){
                // Trackers heading
                html+= tim(trackersHeadingTemplate, {amount: trackers.length});
                // Tracker avatars
                drawList(trackers, 'lanyrd-trackers');
            }

            // Encapsulating div and embedded style
            html = '<div class="lanyrd-widget">' +
                       '<style>' +
                            '.lanyrd-people, .lanyrd-people li  {' +
                                'padding: 0;' +
                                'margin: 0;' +
                            '}' +
                            '.lanyrd-people, .lanyrd-people li {' +
                               ' overflow: hidden;' +
                            '}' +
                            '.lanyrd-people li {' +
                                'list-style: none;' +
                                'float: left;' +
                                'padding-right: 6px;' +
                            '}' +
                       '</style>' +
                       html +
                   '</div>';

            // Instantly resolve and pass rendered html as promise

            deferred.resolve(html);
            return promise;
        }

        return promise;
    };

    // ### people.topics widget

    lanyrd.widgets.people.topics = function(url, elem, options){

    };

    // ### person widget
    //
    // Returns a promise which upon resolution passes markup which describes  
    // lanyrd information about a person.
    //
    // `lanyrd.widget.person('http://lanyrd.com/profile/chrisnewtn/', document.body)`
    //
    // #### parameters:
    //
    // - url:           A lanyrd profile url.
    //
    // - elem:          An optional html dom element which will be populated with 
    //                  the rendered html template. The html is passed to the promise
    //                  resolution callback.
    //
    // - Options        (optional) Object of key value pairs specifying lower level
    //                  parameters.
    //
    //  - templates     Object of key value pairs specifying custom templates for the 
    //                  widget to favour instead of its defaults.
    //
    //   - person       Passed web_url, name, username, avatar_url and short_bio

    lanyrd.widgets.person = function(url, elem, options){
        var promise,
            options = options || {};
            
        options.templates || (options.templates = {});

        function render(person){
            var deferred = lanyrd.utils.deferred(),
                promise = deferred.promise(),
                html,
                personTemplate = options.template.person || '<h2><a href="{{web_url}}">{{name}}</a></h2>' +
                           '<img class="lanyrd-avatar" title="{{name}} ({{username}})" src="{{avatar_url}}">' +
                           '<p>{{short_bio}}</p>';

            html = tim(personTemplate, person);
            deferred.resolve(html);
            return promise;
        }

        promise = lanyrd.person(url).fetch()
            .pipe(function(person){
                return person.get('user');
            })
            .pipe(function(person){
                return render(person).then(function (html) {
                    if (elem) elem.innerHTML = html;
                });
            });

        return promise;
    };

    // ### person.topics widget
    //
    // Returns a promise which upon resolution passes markup, as well as an object, which 
    // describes presumed interests of a lanyrd person. This is done by looking at the
    // topic catagories for the conferences they've attended.
    //
    // `lanyrd.widget.interests('http://lanyrd.com/profile/chrisnewtn/', document.body)`
    //
    // #### Parameters
    //
    // - url:           A lanyrd profile url.
    //
    // - elem:          An optional html dom element which will be populated with 
    //                  the rendered html template. The html is passed to the promise
    //                  resolution callback.
    //
    // - Options        (optional) Object of key value pairs specifying lower level
    //                  parameters.
    //
    //  - amount:       A number (default 10) which shows how many topics to show.
    //
    //  - ignore:       An array of topics **(in lowercase)** to ignore as an interest. 
    //                  Ideal if you want filter out topics which are too popular.
    //
    //  - cutoff:       A number (default 0) which represents the insignifant amount of 
    //                  topic occurance and will lead to that topic being ignored.
    //
    //  - append:       Flag (false by default) for determining how the rendered html 
    //                  template is inserted into the provided dom element. If false 
    //                  any html in the supplied dom element will be overwritten.
    //
    //  - templates     Object of key value pairs specifying custom templates for the 
    //                  widget to favour instead of its defaults.
    //                  (WIP)


    lanyrd.widgets.person.topics = function(url, elem, options) {

        var person = lanyrd.person(url),
            promises = [],
            options = options || {};

        options.templates || (options.templates = {});

        options.amount = options.amount || 10;
        options.ignore = options.ignore || [];
        options.cutoff = options.cutoff || 0;
        options.append = options.append || false;
        options.events = options.events;

        function render(tagMap) {
            var deferred = new lanyrd.utils.deferred(),
                promise = deferred.promise(),
                topics = [],
                lis = '',
                i;

            // Remove ignored tags from tagMap

            lanyrd.utils.each(tagMap, function(val, prop){
                lanyrd.utils.each(options.ignore, function (item) {
                    if(prop.toLowerCase() === item.toLowerCase()){
                        delete tagMap[prop];
                    }
                });
            })

            // Transform tag occurance to ordered list

            lanyrd.utils.each(tagMap, function (val, prop){
                if(val >= options.cutoff){
                    topics.push([prop, val]);
                }
            });

            topics = topics
            .sort(function(a, b) {return b[1] - a[1]})
            .slice(0, options.amount);

            topics = lanyrd.utils.map(topics, function (item) {
                return item[0];
            });

            for (i = 0; i < topics.length; i++) {
                lis += '<li>' + topics[i] + '</li>';
            };

            // Generate final template and resolve

            deferred.resolve(tim(
                options.templates.topics || '<ol class="lanyrd-widget-interests">{{topics}}</ol>',
                {topics: lis}
            ), tagMap);

            return promise;
        }

        // Return the a promise for templated html.
        
        // Fetch person's attendance.

        return person.fetch()
        .pipe(function (resource) {
            if(options.events){
                // TODO
            } else {
                return resource.related('user.attending').fetch();
            }
        })

        // Create an array of Resources from the conferences_attending field
        // Channel it through to lanyrd.topics extension.

        .pipe(function (resource) {
            var resources = lanyrd.utils.map(resource.get('conferences_attending'), function (conf) {
                return lanyrd.resource({url: conf.api_urls.conference});
            });
            return lanyrd.topics(resources);
        })

        // Produce templated HTML

        .pipe(function (tagMap) {
            return render(tagMap).then(function (html) {
                if (elem) elem.innerHTML = (options.append) ? elem.innerHTML += html : html;
            });
        });
    };
    
    // ### series widget
    //
    // Returns a promise which upon resolution passes markup, as well as an object,
    // which describes the events of a lanyrd series. This is done using the
    // lanyrd.series extensions
    //
    // `lanyrd.widgets.series('http://lanyrd.com/series/asyncjs/', document.body)`
    //
    // #### Parameters
    // - url:           A lanyrd series url.
    //
    // - elem:          An optional html dom element which will be populated with 
    //                  the rendered html template. The html is passed to the promise
    //                  resolution callback.
    //
    // - Options        (optional) Object of key value pairs specifying lower level
    //                  parameters.
    //
    //  - amount:       A number (default 0 i.e. unlimited) which shows how many events 
    //                  to show.
    //
    //  - append:       Flag (false by default) for determining how the rendered html 
    //                  template is inserted into the provided dom element. If false 
    //                  any html in the supplied dom element will be overwritten.
    //
    //  - templates:    Object of key value pairs specifying custom templates for the 
    //                  widget to favour instead of its defaults.
    //
    //   - wrapper:     Wraps the entire widget. Expects a {{content}} key.
    //
    //   - upcoming:    Wraps upcoming conferences. Expects a {{conferences}} key.
    //                  Uses the `conference` template for each upcoming conference.
    //
    //   - past:        Wraps past conferences. Expects a {{conferences}} key.
    //                  Uses the `conference` template for each past conference.
    //
    //   - upcomingConference: Wraps each upcoming conference. Expects the {{web_url}} 
    //                  and {{name}} keys. This template is included by both the 
    //                  `upcoming` and `past` templates for each conference.
    //   - pastConference: Wraps each past conference. Expects the {{web_url}} 
    //                  and {{name}} keys. This template is included by both the 
    //                  `upcoming` and `past` templates for each conference.
    
    lanyrd.widgets.series = function (url, elem, options) {
        
        // Check if the series extension is loaded
        
        if (!lanyrd.series) {
            throw('Lanyrd series extension isn\'t loaded!');
        }
        
        var series  = lanyrd.series(url),
            options = options || {};
        
        options.templates || (options.templates = {});
        options.conferences || (options.conferences = {});

        options.amount               = options.amount || 0;
        options.append               = options.append || false;
        options.conferences.upcoming = options.conferences.upcoming || true;
        options.conferences.past     = options.conferences.past || true;
        
        function render(resources) {
            var deferred = new lanyrd.utils.deferred(),
                promise = deferred.promise(),
                html = "",
                now = new Date(),
                conferences = {
                    upcoming: [],
                    past: []
                };
            
            // truncate the resources array
            
            if (options.amount > 0) {
                resources = resources.slice(0, options.amount);
            }
            
            // notify the user if no events were found
            
            if (resources.length === 0) {
                html += '<h2>no events found for the series</h2>';
            }
            
            // render each conference and sort
            
            lanyrd.utils.each(resources, function (val, prop) {
                if (new Date(val.conference.end_date + " 23:59:59") > now) {
                    conferences.upcoming.push(tim(
                        options.templates.upcomingConference || 
                        '<li><a href="{{web_url}}">{{name}}</a></li>',
                        val.conference
                    ));
                } else {
                    conferences.past.push(tim(
                        options.templates.pastConference || 
                        '<li><a href="{{web_url}}">{{name}}</a></li>',
                        val.conference
                    ));
                }
            });

            // place upcoming conferences into upcoming list
            
            if (options.conferences.upcoming) {
                var sorted = [];

                // sort the conferences by date in decending order

                for (var i = conferences.upcoming.length-1; i >= 0; i--) {
                    sorted.push(conferences.upcoming[i]);
                }

                // render them out

                html += tim(
                    options.templates.upcoming || 
                    '<div class="upcoming conferences"><h1>Upcoming Events</h1><ul>{{conferences}}</ul></div>',
                    {conferences: sorted.join("")}
                );
            }

            // place past conferences into past list
            
            if (options.conferences.past) {
                html += tim(
                    options.templates.past || 
                    '<div class="past conferences"><h1>Past Events</h1><ul>{{conferences}}</ul></div>',
                    {conferences: conferences.past.join("")}
                );
            }
            
            // place the list items into the the list and resolve it
                
            deferred.resolve(tim(
                options.templates.wrapper || 
                '<div class="lanyrd-widget-series">{{content}}</div>',
                {content:html}
            ), resources);
            
            return promise;
        }
        
        // Return a promisefor the templated html
        
        // Fetch each event in a series
        
        return series
        .fail(function () {
            console.log("JSONP Failed.");
        })
        .pipe(function () {
            var resources = lanyrd.utils.map(arguments, function (res) {
               return res && res.length && res[0].data;
            });
            
            return render(resources).then(function (html) {
                if (elem) elem.innerHTML = (options.append) ? elem.innerHTML += html : html;
            });
        });
    };

    // ### series.topics widget
    //
    // Returns a promise which upon resolution passes markup, as well as an object, which 
    // describes presumed interests of a lanyrd series. This is done by looking at the
    // topic catagories for the conferences within that series.
    //
    // `lanyrd.widget.interests('http://lanyrd.com/profile/chrisnewtn/', document.body)`
    //
    // #### Parameters
    //
    // - url:           A lanyrd profile url.
    //
    // - elem:          An optional html dom element which will be populated with 
    //                  the rendered html template. The html is passed to the promise
    //                  resolution callback.
    //
    // - Options        (optional) Object of key value pairs specifying lower level
    //                  parameters.
    //
    //  - amount:       A number (default 10) which shows how many topics to show.
    //
    //  - ignore:       An array of topics **(in lowercase)** to ignore as an interest. 
    //                  Ideal if you want filter out topics which are too popular.
    //
    //  - cutoff:       A number (default 0) which represents the insignifant amount of 
    //                  topic occurance and will lead to that topic being ignored.
    //
    //  - append:       Flag (false by default) for determining how the rendered html 
    //                  template is inserted into the provided dom element. If false 
    //                  any html in the supplied dom element will be overwritten.
    //
    //  - templates     Object of key value pairs specifying custom templates for the 
    //                  widget to favour instead of its defaults.
    //
    //   - topics       Passed the {{topic}} template multiple times for each topic
    //
    //   - topic        Passed the {{topic}} tag name.

    lanyrd.widgets.series.topics = function (url, elem, options) {
        var options = options || {};

        options.templates || (options.templates = {});

        options.append = options.append || false;
        options.amount = options.amount || 10;
        options.ignore = options.ignore || [];
        options.cutoff = options.cutoff || 0;

        function render(tagMap) {
            var deferred = new lanyrd.utils.deferred(),
                promise = deferred.promise(),
                topics = [],
                lis = '',
                i;

            // Remove ignored tags from tagMap

            lanyrd.utils.each(tagMap, function(val, prop){
                lanyrd.utils.each(options.ignore, function (item) {
                    if(prop.toLowerCase() === item.toLowerCase()){
                        delete tagMap[prop];
                    }
                });
            })

            // Transform tag occurance to ordered list

            lanyrd.utils.each(tagMap, function (val, prop){
                if(val >= options.cutoff){
                    topics.push([prop, val]);
                }
            });

            topics = topics
            .sort(function(a, b) {return b[1] - a[1]})
            .slice(0, options.amount);

            topics = lanyrd.utils.map(topics, function (item) {
                return item[0];
            });

            for (i = 0; i < topics.length; i++) {
                lis += tim(options.templates.topic || '<li>{{topic}}</li>', {topic: topics[i]});
            };

            // Generate final template and resolve

            deferred.resolve(tim(
                options.templates.topics || '<ol class="lanyrd-widget-interests">{{topics}}</ol>',
                {topics: lis}
            ), tagMap);

            return promise;
        }

        // Get a number of different conference Resources from the series extension

        return lanyrd.series(url).pipe(function () {
            return lanyrd.utils.map(arguments, function (res) {
                return res[0];
            });
        })

        // Pipe these conference resources to the topics extension

        .pipe(lanyrd.topics)

        // Render the topic occurance map the topics extension gives us

        .pipe(function (tagMap) {
            return render(tagMap).then(function (html) {
                if (elem) elem.innerHTML = (options.append) ? elem.innerHTML += html : html;
            });
        });
    };

}(lanyrd));
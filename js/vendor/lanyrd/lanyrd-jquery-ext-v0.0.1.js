/*  lanyrd.js - v0.0.1 
 *  Copyright 2011-2012, Dharmafly <http://dharmafly.com> 
 *  Released under the MIT License 
 *  More Information: https://github.com/dharmafly/lanyrd.js 
 */
(function (_lanyrd, jQuery, module, undefined) {
    "use strict";

    var config, utils, lanyrd, parseUrl;

    // Useful utility functions for working with deferred's.
    utils = {
        // Cached anchor element for parsing urls. This is used by url methods
        // like .pathname().
        a: module.document && module.document.createElement('a'),

        // Check to see if the passed object is an array.
        isArray: function (object) {
            return Object.prototype.toString.call(object) === '[object Array]';
        },

        // Iterates over an array or object and calls the callback with each
        // item.
        each: function (items, fn, context) {
            var index = 0, length = typeof items === 'object' && items.length, item;
            if (typeof length === 'number') {
                for (;index < length; index += 1) {
                    item = items[index];
                    fn.call(context || item, item, index, items);
                }
            } else {
                for (index in items) {
                    if (items.hasOwnProperty(index)) {
                        item = items[index];
                        fn.call(context || item, item, index, items);
                    }
                }
            }
            return items;
        },

        // Returns the keys for the object provided in an array.
        keys: function (object) {
            return utils.map(object, function (value, key) {
                return key;
            });
        },

        // Iterates over an array or object and collects the return values of
        // each callback function and returns it in an array.
        map: function (items, fn, context) {
            var collected = [];
            utils.each(items, function (item) {
                collected.push(fn ? fn.apply(this, arguments) : item);
            }, context);
            return collected;
        },

        // Iterates over an array or object and collects items where the
        // callback returned a truthy value and returns them in an array.
        filter: function (items, fn, context) {
            var collected = [];
            utils.each(items, function (item) {
                if (fn.apply(this, arguments)) {
                    collected.push(item);
                }
            }, context);
            return collected;
        },

        // Extend the first object passed as an argument with successive ones.
        extend: function (reciever) {
            var target  = arguments[0],
                objects = Array.prototype.slice.call(arguments, 1),
                count = objects.length,
                index = 0, object, property;

            for (; index < count; index += 1) {
                object = objects[index];
                for (property in object) {
                    if (object.hasOwnProperty(property)) {
                        target[property] = object[property];
                    }
                }
            }

            return target;
        },

        // Calls the method on the object provided, subsequent arguments will
        // be passed in to the method. Returns an array containing the returned
        // values of each function.
        invoke: function (object, method /* args */) {
            var collected = [], args = [].slice.call(arguments, 2);
            utils.each(object, function (item) {
                collected.push(item[method].apply(item, args));
            });
            return collected;
        },

        // Extracts a single property from each object in the collection.
        pluck: function (object, path, fallback) {
            var args = [].slice.call(arguments, 2);
            return utils.map(object, function (item) {
                return utils.keypath(item, path, fallback);
            });
        },

        // Creates a new deferred object.
        deferred: function () {
            if (jQuery && jQuery.Deferred) {
                return new jQuery.Deferred();
            }
            return new utils._.Deferred();
        },

        // Allows you to determine when multiple promises have resolved. Each
        // promise should be provided as an argument. Alternatively a single
        // array of promises can be provided.
        when: function (array) {
            var promises = arguments.length === 1 && utils.isArray(array) ? array : arguments;
            if (jQuery && jQuery.Deferred) {
                return jQuery.when.apply(jQuery, promises);
            }
            return utils._.when.apply(utils._, promises);
        },

        // Requests a json representation from the url provided. Returns a
        // promise object. This should be used to request resources from the
        // lanyrd API, it includes specialised error handling for the API.
        request: function (url) {
            var type     = config.requestType,
                request  = utils.rawRequest(url, type),
                deferred = utils.deferred(),
                promise  = deferred.promise({
                    data: null,
                    type: type,
                    xhr:  type === utils.request.JSONP ? null : request
                });

            request.then(function (data) {
                promise.data = data;
                deferred[!data || data.error ? 'reject' : 'resolve'](promise);
            }, function () {
                deferred.reject(promise);
            });

            return promise;
        },

        // Request function that will use jQuery if available otherwise fall back to
        // the built in lanyrd methods. Allows the type to be specified, this
        // can be used by scripts to request non lanyrd methods.
        rawRequest: function (url, type) {
            type = type || 'json';
            if (jQuery) {
                return jQuery.ajax({url: url, dataType: type});
            }
            return lanyrd.utils[type](url);
        },

        // Escapes html entities within a string.
        // https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet#RULE_.231_-_HTML_Escape_Before_Inserting_Untrusted_Data_into_HTML_Element_Content
        escape: function (string) {
            return ('' + string)
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/'/g,  '&#x27;')
            .replace(/\//g, '&#x2F;');
        },

        // Function for looking up a value in an object using a key path (period
        // delimited string).
        // Often useful when working with large objects such as JSON data returned
        // from a server as it allows quick navigation to only the required
        // information.
        keypath: function keypath(object, path, fallback, prototype) {
            var keys = (path || '').split('.'),
                key;

            if (!path) {
                return object;
            }

            while (object && keys.length) {
                key = keys.shift();

                if (object.hasOwnProperty(key) || (prototype === true && object[key] !== undefined)) {
                    object = object[key];

                    if (keys.length === 0 && object !== undefined) {
                        return object;
                    }
                } else {
                    break;
                }
            }

            return (arguments.length > 2) ? fallback : null;
        },

        // Returns the pathname of a url.
        pathname: function (url) {
            utils.a.href = url || '/';
            return utils.a.pathname;
        }
    };

    utils.request.JSON  = 'json';
    utils.request.JSONP = 'jsonp';

    // A Collection is simply a collection of objects, it provides support for
    // iteration as well as getting properties and related resources. It treats the
    // collection in the same way that jQuery does in that a getter method will
    // return just the first item. To access all children the iterator methods
    // should be used.
    function Collection(items) {
        items = utils.isArray(items) ? items : [items];
        for (var index = 0, len = items.length, item; index < len; index += 1) {
            item = items[index];
            if (item instanceof Collection || item instanceof Resource) {
                item = item.get();
            }
            this[index] = item;
        }
        this.length = items.length;
    }

    Collection.prototype = {
        constructor: Collection,

        // Lookup keys in the attributes object, period delimited key paths can
        // be used to access nested keys without having to check for the
        // existence of each property. This method will return a single object
        // for the first item in the list.
        get: function (path, fallback) {
            return utils.keypath(this[0], path, fallback);
        },

        // Same as #get() but path returns the property with html entities escaped
        // if it is a string, otherwise returns the coerced value.
        escape: function (path, fallback) {
            return utils.escape(this.get(path, fallback));
        },

        // Gets a related resource for the key provided. If the current resource
        // doesn't support the key then a rejected Resource will be returned.
        // Accepts an optional prefix in case the object with the api urls is
        // nested further into the model chain. For example a user is nested
        // inside speaker and attendee objects.
        //
        // If the path provided returns a url then this will be loaded.
        //
        // Examples:
        //
        //     var related = speakers.related('user.user');
        //     var related = conference.related('attendees');
        //
        //     // Direct path to a resource url also works.
        //     var related = speakers.related('user.api_urls.user');
        related: function (path) {
            var parts = path.split('.'),
                key   = parts.pop(),
                url;

            parts.push('api_urls');

            // Needs to support various keypaths including.
            // "api_url", "api_urls.attendees", "user.api_urls.user"
            url = this.get(parts.join('.'), {})[key];
            if (!url) {
                url = this.get(path);
            }
            return url ? new Resource({url: url}) : Resource.noop();
        },

        // Same as #related() but immediately calls #fetch() on the resource.
        fetchRelated: function (path, success, error) {
            return this.related(path).fetch(success, error);
        },

        // Fetches the related resource for all items in the list. Useful for
        // requesting all attendees to a conference for example. The method will
        // return a generic promise object. #done() callbacks receive two
        // arguments, an array of completed resources and an array of request
        // (jqXHR) objects.
        fetchAllRelated: function (path, success, error) {
            var deferred = utils.deferred();

            function iterator(item) { return item.fetchRelated(path); }
            jQuery.when.apply(jQuery, this.map(iterator)).then(function () {
                var resources = [], requests = [];
                jQuery.each(arguments, function () {
                    requests.push(this[1]);
                    resources.push(this[0]);
                });
                deferred.resolve(resources, requests);
            }, deferred.reject);

            return deferred.promise().then(success, error);
        },

        // Get the object at the index provided. A negative index takes items
        // from the end of the list.
        at: function (index) {
            index = index < 0 ? index + this.length : index;
            return this[index] || null;
        }
    };

    utils.each(['each', 'map', 'filter', 'pluck', 'invoke'], function (method) {
        Collection.prototype[method] = function () {
            return utils[method].apply(this, [].concat.apply(this, arguments));
        };
    });

    // The Resource acts as a request builder for the API and provides basic
    // methods for accessing the returned data. For most use cases it will be
    // all you need to interact with the API. Each instance requires a full path
    // to a Lanyrd resource which can then be fetched. Once loaded the data can
    // be accessed and pages can be iterated. Using a Resource requires full
    // knowledge of the returned data structure.
    //
    // Related resources can also be fetched using the #related() method this
    // allows the API to be traversed using the keys found under the "api_urls"
    // parameter.
    function Resource(options) {
        options = options || {};

        this.url  = options.url;
        this.data = options.data || {};

        var deferred = options.deferred || utils.deferred();
        if (this.url) {
            // We create the fetch method within the constructor to hide the
            // deferred object within the closure.
            this.fetch = function (success, error) {
                if (this.state() !== Resource.PENDING) {
                    return this;
                }

                var url = this.url, request, resource;

                if (config.requestType === utils.request.JSONP) {
                    url += (url.indexOf('?') < 0 ? '?' : '&') + 'callback=?';
                }
                request  = utils.request(url);
                resource = this;

                request.done(function () {
                    resource.data = request.data;
                    deferred.resolveWith(resource, [resource, request]);
                });
                request.fail(function () {
                    deferred.rejectWith(resource, [resource, request]);
                });

                return this.then(success, error);
            };
        }
        deferred.promise(this);
    }

    // Constants for use with pagination.
    Resource.PREV = 'prev';
    Resource.NEXT = 'next';

    // Constants for use with Resource#state().
    Resource.RESOLVED = 'resolved';
    Resource.REJECTED = 'rejected';
    Resource.PENDING  = 'pending';

    // Creates a rejected Resource that can be returned by methods when a
    // request cannot be made. For example at the last page of a paginated
    // collection or if no related resource exists.
    Resource.noop = function (options) {
        var rejected = utils.deferred(),
            noop = new Resource(utils.extend({deferred: rejected}, options));

        rejected.rejectWith(noop, [noop, null]);
        return noop;
    };

    Resource.prototype = {
        constructor: Resource,

        url:   null,
        data:   null,

        // Actually defined in the constructor to hide the deferred object
        // within a closure. This method loads the resource available at the
        // Resource#url endpoint. If no href is provided to the constructor
        // then this method is a no-op.
        fetch: function () { return this; },

        // Checks to see if the current resource was successfully loaded from
        // the server. Will return false if the request failed or is still
        // pending. Resource#state() can be used for more fine grained checks.
        fetched: function () {
            return this.state && this.state() === Resource.RESOLVED;
        },

        // Shortcut to Collection#related(). Can be used to fetch a related resource.
        related: function (path) {
            return this.collection().related(path);
        },

        // Lookup keys in the raw data object returned from the server.
        get: function (path, fallback) {
            return utils.keypath(this.data, path, fallback);
        },

        // Gets a path for a string with html entities escaped.
        escape: function (path, fallback) {
            return utils.escape(this.get(path, fallback));
        },

        // Like #get() but wraps the resource at the end of the path in a Collection
        // this makes it much easier to work with some of the resource data such
        // as a list or user object.
        collection: function (path) {
            var data = this.get(path);
            if (data) {
                data = new Collection(data);
            }
            return data;
        },

        // Paginates through the resource in the direction specified. Use one of the
        // Resource.NEXT or Resource.PREV constants for the first argument. This
        // method returns an unloaded Resource object. To actually fetch the
        // page you must call #fetch().
        paginate: function (direction) {
            var url = this.get('pagination.api_urls', {})[direction];
            return url ? new Resource({url: url}) : Resource.noop();
        },

        // Checks to see if the current resource is paginated. It can be useful
        // to call this before #next() #prev() or #all().
        paginated: function () {
            return this.get('pagination.num_pages', 1) > 1;
        },

        // Checks to see if this resource is the first page. If there is no
        // pagination then this will still return true.
        first: function () {
            return this.get('pagination.page', 1) === 1;
        },

        // Checks to see if the resource is the last page. Returns true if there
        // is only one page or there is no pagination data.
        last: function () {
            var pagination = this.get('pagination', {});
            return pagination.page === pagination.num_pages;
        },

        // Requests the next page of resources in a collection and returns the
        // promised resource. This calls fetch internally, both success and
        // error callbacks can be passed as arguments.
        next: function (success, error) {
            return this.paginate(Resource.NEXT).fetch().then(success, error);
        },

        // Requests the previous page of resources in a collection and returns the
        // promised resource. This calls fetch internally, both success and
        // error callbacks can be passed as arguments.
        prev: function (success, error) {
            return this.paginate(Resource.PREV).fetch().then(success, error);
        },

        // Walks through all pages for a paginated resource and collects the
        // results in a single array. This is then returned as a new "master"
        // Resource.
        all: function (success, error) {
            var self      = this,
                deferred  = utils.deferred(),
                combined  = new Resource({deferred: deferred});

            function inner() {
                var key = self.get('pagination.paginated_key'),
                    collected = [],
                    remaining = 2;

                function complete(resource, request) {
                    remaining -= 1;
                    if (remaining) {
                        return;
                    }

                    if (!request) {
                        combined.data = {};
                        combined.data[key] = collected;
                        deferred.resolveWith(combined, [combined]);
                    } else {
                        deferred.rejectWith(combined, [combined, request]);
                    }
                }

                (function backward(resource) {
                    if (!resource.flag) {
                        resource.flag = true;
                        deferred.notifyWith(resource, arguments);
                        collected = resource.get(key).slice().concat(collected);
                    }
                    return resource.prev().then(backward, complete);
                })(self);

                (function forward(resource) {
                    if (!resource.flag) {
                        resource.flag = true;
                        deferred.notifyWith(resource, arguments);
                        collected = collected.concat(resource.get(key));
                    }
                    return resource.next().then(forward, complete);
                })(self);
            }

            // If the current object is not yet loaded then do so before
            // loading related resources.
            if (this.fetched()) {
                inner();
            } else {
                this.fetch().always(inner);
            }

            return combined.then(success, error);
        }
    };

    // The base API object.
    lanyrd = {
        API_DOMAIN: 'http://lanyrd.asyncjs.com',

        // Attempts to match a conference resource for the Lanyrd url provided.
        // This breaks rest conventions but provides a nicer API for people to
        // get started quickly.
        conference: function (url) {
            return this.resource({url: this.url(url)});
        },
        person: function (url) {
            var apiUrl = this.url(url).replace(/\/profile\//i, '/people/');
            return this.resource({url: apiUrl});
        },
        place: function (url) {
            return this.resource({url: this.url(url)});
        },
        topic: function (url) {
            return this.resource({url: this.url(url)});
        },
        collection: function (object) {
            return new Collection(object);
        },
        resource: function (options) {
            return new Resource(options);
        },
        url: function (url) {
            // Oh dear, here we assume that a Lanyrd API endpoint is the same as
            // the website. Ideally there should be some kind of lookup service
            // that does this for us.
            return this.API_DOMAIN + utils.pathname(url);
        },
        // Allows you to switch between JSON and JSONP transports.
        config: function (newer) {
            utils.extend(config, newer);
        },
        utils: utils,
        noConflict: function () {
            module.lanyrd = _lanyrd;
            return lanyrd;
        },
        Collection: Collection,
        Resource: Resource
    };

    config = {requestType: utils.request.JSONP};

    if (typeof module.define === 'function' && module.define.amd) {
        module.define('lanyrd', function () {
            return lanyrd;
        });
    } else if (module.exports) {
        // Pass utils object into module factories to be augmented.
        require('./lanyrd/deferred')(utils);
        require('./lanyrd/request')(utils);

        // Override pathname with node specific code.
        parseUrl = require('url').parse;
        lanyrd.utils.pathname = function (url) {
            return parseUrl(url).pathname;
        };
        // Default request type is now JSON.
        config.requestType = utils.request.JSON;

        module.exports = lanyrd;
    } else {
        module.lanyrd = lanyrd;
    }

})(this.lanyrd, this.jQuery, typeof module !== 'undefined' ? module : this);
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
    // `lanyrd.widgets.people('http://lanyrd.com/2012/asyncjs-kirin/', document.body)`
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
    //  - templates:    Object of key value pairs specifying custom templates for the 
    //                  widget to favour instead of its defaults.
    //
    //   - attendeesHeading: For the heading above the attendees. Expects the {{amount}} and
    //                  {{attendees_url}} keys.
    //
    //   - trackersHeading: For the heading above the tackers. Expects the {{amount}} key.
    //
    //   - people:      The wrapper used for both the attendees list and the trackers list.
    //                  Expects the {{people_type}} and {{list}} keys.
    //
    //   - person:      The markup for each person in the the attendees and trackers lists.
    //                  Expects the {{web_url}}, {{name}}, {{username}} & {{avatar_url}} keys.

    lanyrd.widgets.people = function(url, elem, options) {
        var promise,
            conference,
            options = options || {};
            options.all = options.all || true;
            options.templates || (options.templates = {});

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
                attendeesHeadingTemplate = options.templates.attendeesHeading || '<h2 class="lanyrd-attendees-title"><a target="_blank" href={{attendees_url}}>{{amount}} attending</a></h2>',
                trackersHeadingTemplate = options.templates.trackersHeading || '<h2 class="lanyrd-trackers-title">{{amount}} tracking</h2>',
                peopleTemplate = options.templates.people || '<ul class="lanyrd-people {{people_type}}">{{list}}</ul>',
                personTemplate = options.templates.person || '<li><a href="{{web_url}}"><img class="lanyrd-avatar" title="{{name}} ({{username}})" src="{{avatar_url}}"></a></li>',
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
                html += tim(peopleTemplate, {list: builtUpTemplate, people_type: peopleType});
            };

            // Build the rest of the template
            // (!) Needs cleanup!
            // Only 'see more attendees' link supported on single conferences (no merged events)

            // Attendees heading
            html += tim(attendeesHeadingTemplate, {amount: attendees.length, attendees_url: (conference ? conference.web_url + 'attendees' : '')});

            // Attendee avatars
            drawList(attendees, 'lanyrd-attendees');

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
    // `lanyrd.widgets.person('http://lanyrd.com/profile/chrisnewtn/', document.body)`
    //
    // #### parameters:
    //
    // - url:           A lanyrd profile url.
    //
    // - elem:          An optional html dom element which will be populated with 
    //                  the rendered html template. The html is passed to the promise
    //                  resolution callback.
    //
    //  - append:       Flag (false by default) for determining how the rendered html template 
    //                  is inserted into the provided dom element. If false any html in the 
    //                  supplied dom element will be overwritten.
    //
    // - Options        (optional) Object of key value pairs specifying lower level
    //                  parameters.
    //
    //  - templates     Object of key value pairs specifying custom templates for the 
    //                  widget to favour instead of its defaults.
    //
    //   - person       Passed web_url, name, username, avatar_url and short_bio

    lanyrd.widgets.person = function(url, elem, options){
        var options = options || {};
            
        options.templates || (options.templates = {});

        function render(person){
            var deferred = lanyrd.utils.deferred(),
                promise = deferred.promise(),
                html,
                personTemplate = options.templates.person || '<h2><a href="{{web_url}}">{{name}}</a></h2>' +
                           '<img class="lanyrd-avatar" title="{{name}} ({{username}})" src="{{avatar_url}}">' +
                           '<p>{{short_bio}}</p>';

            html = tim(personTemplate, person);
            deferred.resolve(html);
            return promise;
        }

        return lanyrd.person(url).fetch()
        .pipe(function (person) {
            return person.get('user');
        })
        .pipe(render)
        .then(function (html) {
            if (elem) {
                elem.innerHTML = (options.append) ? elem.innerHTML += html : html;
            }
        });
    };

    // ### person.topics widget
    //
    // Returns a promise which upon resolution passes markup, as well as an object, which 
    // describes presumed interests of a lanyrd person. This is done by looking at the
    // topic catagories for the conferences they've attended.
    //
    // `lanyrd.widgets.person.topics('http://lanyrd.com/profile/chrisnewtn/', document.body)`
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
                if (val.conference.end_date + "T23:59:59.000Z" > new Date().toISOString()) {
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
    // `lanyrd.widgets.topics('http://lanyrd.com/profile/chrisnewtn/', document.body)`
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

}(lanyrd));(function (lanyrd) {
    var utils = lanyrd.utils,

        // Related conference resources to load. We use an array to be certain
        // of ordering. These are also referred to as "groups".
        RELATION_KEYS = ['staff', 'speakers', 'attendees', 'trackers'],

        // Each person will be sorted within their group. Weight is given
        // depending on the role.
        RELATION_WEIGHTS = {staff: 4, speakers: 4, attendees: 2, trackers: 1},

        // Maintain a counter for unregistered user ids.
        uuid = 0;

    // Simple in array check. Returns true if found unlike jQuery.inArray().
    function inArray(array, needle) {
        for (var i = 0, length = array.length; i < length; i += 1) {
            if (array[i] === needle) {
                return true;
            }
            return false;
        }
    }

    // Exposed API method returns a single object containing keys for related
    // groups. A user will only appear within a group once. The method expects
    // an array of conference resources. They will be fetched if they are not
    // already loaded from the server.
    //
    // The method will return a promise object, you can pass callbacks to the
    // .done() method to receive the results.
    //
    // Various options can be provided to override the default behaviour.
    //
    // related           - an array of relations to load or an object of
    //                     relation/weight mapping to use. eg. {attendees: 1, trackers:
    //                     0.5}, any keys not included will not be fetched. eg.
    //                     { related: ['speakers', 'trackers']}
    //                     0.5}, any keys not included will not be fetched.
    // comparator        - a function to sort each array of users, it will receive two
    //                     user objects to compare.
    // duplicateAttendee - By default speakers and staff are included in the
    //                     attendees array, to prevent this set this to false.
    //
    // Examples:
    //
    //   var jungle1 = lanyrd.conference('http://lanyrd.com/2011/asyncjs-jungle-1/');
    //   var jungle2 = lanyrd.conference('http://lanyrd.com/2011/asyncjs-jungle-2/');
    //   var options = {
    //     related: { /* Do not fetch staff. */
    //       speakers:  2,
    //       attendees: 1,
    //       trackers:  0.5
    //     },
    //     duplicateAttendee: false /* Do not include speakers in attendees array */
    //   };
    //
    //   lanyrd.mergeRelated([jungle1, jungle2], options).done(function (merged) {
    //     // Do something with the results.
    //   });
    //
    // Extra:
    //
    //   The options.related property can also be set as array rather than a key
    //   value mapping...
    //
    //   var options = {
    //       related: ['speakers', 'attendees']
    //   }
    //
    lanyrd.mergeRelated = function (conferences, options) {
        var resources, comparator, weights;

        options = options || {};
        resources = utils.map(conferences, function (conference) {
            return conference.fetch();
        });

        // The weight each relation adds to a users score. If a relation is
        // excluded from the object it will not be fetched.
        weights = options.related || RELATION_WEIGHTS;

        // If an array of relations is provided then use the default weights.
        if (utils.isArray(options.related)) {
            weights = {};
            utils.each(options.related, function (relation) {
                weights[relation] = RELATION_WEIGHTS[relation];
            });
        }

        // Comparator function for sorting the array of people within a merged group.
        comparator = options.comparator || function (a, b) {
            if (a.score === b.score) {
                return a.username > b.username ? 1 : -1;
            }
            return a.score > b.score ? -1 : 1;
        };

        // A filter method that expects n conference resources to be passed in.
        // It will then fetch all related resources, the done callback will receive
        // an object for each conference with an array of users for each related
        // group.
        function fetchRelated(/* conferences... */) {
            var all = [], keys = utils.keys(weights);

            utils.each(arguments, function (conference) {
                var related = utils.map(keys, function (key) {
                    return conference[0].collection('conference').related(key).fetch().pipe(function (rel) {
                        return rel.get(rel.get('pagination.paginated_key'));
                    });
                });
                all = all.concat(related);
            });

            return utils.when.apply(null, all).pipe(function () {
                var all = [], collected = {};

                utils.each(arguments, function (users, index) {
                    var remainder = index % keys.length;

                    collected[keys[remainder]] = utils.map(users, function (speaker) {
                        if (speaker.user) {
                            return speaker.user;
                        } else {
                            delete speaker.user;
                            if (!speaker.username) {
                                speaker.username = 'user-' + (uuid += 1);
                            }
                            return speaker;
                        }
                    });

                    if (remainder === keys.length - 1) {
                        all.push(collected);
                        collected = {};
                    }
                });
                return all;
            });
        }

        // Merges the results of fetchRelated() into a single object with a single
        // array of users for each related group. Each user is also given a score
        // depending on the number of times they appear with each conference. Each
        // group array is sorted by this score.
        function mergeRelated(allRelations) {

            // We keep a map of usernames to ensure that a user is only included in
            // an array once, an object lookup is much faster than an array. We
            // also cache the user the first time they occur to ensure we always
            // modify the score of the same object.
            var merged = {}, mapped = {}, cache = {};

            // Checks to see if the person should be duplicated in the attendees
            // array or not.
            function includeAttendee(key, person) {
                return options.duplicateAttendee !== false &&
                       key === 'attendees' &&
                       inArray(person, merged[key]);
            }

            // Checks to see if the person has already been included in a group and
            // updates that persons "score" property.
            function checkPerson(key, person) {
                var cached = cache[person.username];

                if (!cached) {
                    cached = cache[person.username] = person;
                }

                if (!merged[key]) {
                    merged[key] = [];
                }

                if (!mapped[cached.username] || includeAttendee(key, cached)) {
                    merged[key].push(cached);
                    mapped[cached.username] = key;
                }

                cached.score = cached.score || 0;
                cached.score += weights[key];
            }

            // Loop through all conference relations and build a single merged
            // object with all users.
            utils.each(RELATION_KEYS, function (key) {
                // Only continue if the caller has requested this key.
                if (weights[key]) {
                    utils.each(allRelations, function (relations) {
                        var people = relations[key];
                        utils.each(people, function (person) {
                            checkPerson(key, person);
                        });
                    });
                }
            });

            // Now sort each array by score.
            utils.invoke(merged, 'sort', comparator);
            return merged;
        }

        return utils.when.apply(null, resources).pipe(fetchRelated).pipe(mergeRelated);
    };
})(this.lanyrd);
/*
  An extension which is fed a number of conference resources and returns 
  a promise. When this promise resoles its callback is passed an object of 
  tags with their occurance count.

  The conference resources do not have to be already fetched when passed to 
  this extension.
*/

(function (lanyrd) {
    "use strict";

    lanyrd.topics = function topics (resources) {
        
        // Check if resources have not been fetched.
        //
        // (!) Dangerous check. Makes assumption of all the resources
        //     based of one resource.

        if(!resources[0].fetched()){
            resources = lanyrd.utils.map(resources, function (resource) {
                return resource.fetch();
            });
        }

        // Return a promise. Its resolving callback is passed 
        // the tag's occurance object.

        return lanyrd.utils.when(resources)
        .pipe(collectTags);
    };

    // Create the tag's occurance object.

    function collectTags() {
        var deferred = new lanyrd.utils.deferred(),
            promise = deferred.promise(),
            tagMap = {};

        lanyrd.utils.each(arguments, function (item) {
            lanyrd.utils.each(item[0].get('conference.topics'), function (topic) {
                if (tagMap[topic.name]) {
                    tagMap[topic.name]++;
                } else {
                    tagMap[topic.name] = 1;
                }
            });
        });

        deferred.resolve(tagMap);
        return promise;
    }

}(lanyrd));
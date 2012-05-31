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

(function (lanyrd) {
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

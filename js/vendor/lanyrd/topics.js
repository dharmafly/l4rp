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
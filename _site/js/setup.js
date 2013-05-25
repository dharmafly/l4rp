(function(document){
    'use strict';

    // Feature detect
    var htmlElem = document.documentElement,
        className = htmlElem.className,
        supportsLocalStorage = 'localStorage' in window,
        supportsJSON = 'JSON' in window,
        supportsSvg = 'createElementNS' in document &&
            'createSVGRect' in document.createElementNS('http://www.w3.org/2000/svg', 'svg');


    // Set CSS classes on the <html> element
    className = className ? className + ' ' : '';
    className += 'js ';

    className += supportsSvg ? 'svg' : 'no-svg';

    // Set className
    htmlElem.className = className;


    // Create window.L4RP
    (function(){
        var dev = /^\?dev[\W\/]?/.test(window.location.search),
            offline = /^\?offline[\W\/]?/.test(window.location.search),
            extension = dev ? '.js' : '.min.js';

        // Site settings
        window.L4RP = {
            dev: dev,
            offline: offline,
            support: {
                svg: supportsSvg,
                localStorage: supportsLocalStorage,
                json: supportsJSON
            },
            scripts: {
                jquery: 'http://code.jquery.com/jquery-1.7.1' + extension,
                lanyrd: '/js/vendor/lanyrd/lanyrd-jquery-ext-v0.2.0' + extension + '?v3',
                jasonpeewee: '/js/vendor/jasonpeewee' + extension
            }
        };
    }());

}(this.document));
(function(window, cmd){
    'use strict';

    if (!cmd){
        return;
    }

    // Analytics
    function setupAnalytics(){
        var _gaq = window._gaq || (window._gaq = []),
        gaUrl = ('https:' === document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
        
        _gaq.push(['_setAccount', 'UA-2150808-20']);
        _gaq.push(['_setDomainName', 'l4rp.com']);
        _gaq.push(['_trackPageview']);
        
        cmd(gaUrl);
    }
    
    // Init
    setupAnalytics();

}(this, this.cmd));
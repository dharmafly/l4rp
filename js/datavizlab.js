(function(window, document, cmd, L4RP){
    'use strict';

    if (!cmd){
        return;
    }

    function createWidgets () {
        var dataVis = document.getElementById('data-vis-attendees'),
            dataVisEvents = [
                'http://lanyrd.com/2012/l4rp-dv1/',
                'http://lanyrd.com/2012/l4rp-dv2/',
                'http://lanyrd.com/2012/l4rp-dv3/'
            ],
            dataVisOptions = {
                  append: false,
                  templates: {
                      attendeesHeading: '<h2 class="lanyrd-attendees-title">{{amount}} attending</h2>'
                  }
            };

        if (dataVis){
            dataVis.textContent = "Getting Attendees...";
            createEventWidget(dataVis, dataVis, dataVisEvents, dataVisOptions);
            dataVis.style.display = "block";
        }
    }

    function createEventWidget(element, loadingElement, eventHref, options) {
        var intervalDelay = 618,
            lanyrd = window.lanyrd,
            intervalRef, lanyrdWidget;

        if (lanyrd && element && loadingElement) {
            intervalRef = window.setInterval(function(){
                loadingElement.textContent += ".";
            }, intervalDelay);

            lanyrdWidget = lanyrd.widgets.people(eventHref, element, options);
                
            lanyrdWidget
                .always(function(){
                    window.clearInterval(intervalRef);
                    intervalRef = null;
                })
                .fail(function(){
                    loadingElement.textContent += "!";
                });
        }

        return lanyrdWidget;
    }
    
    
    /////
    
    
    // Init
    cmd(L4RP.scripts.jquery, L4RP.scripts.lanyrd, createWidgets);
    
}(this, this.document, this.cmd, window.L4RP));
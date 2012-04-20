(function(){
    var cloudmadeApiKey = '2b0e47feae114fa39f72028297b0e59c',
        popupHtml = 'Lab for the Recently Possible',
        
        /////
    
        map = new L.Map('map'),
        cloudmade = new L.TileLayer('http://{s}.tile.cloudmade.com/' + cloudmadeApiKey + '/997/256/{z}/{x}/{y}.png', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
            maxZoom: 18
        }),
        marker = new L.Marker(new L.LatLng(50.83337,-0.16400));

    map.addLayer(cloudmade)
       .setView(new L.LatLng(50.83337,-0.16400), 16)
       .addLayer(marker);

    // attach a given HTML content to the marker and immediately open it
    marker.bindPopup(popupHtml).openPopup();
}());

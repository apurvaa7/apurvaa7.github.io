var park_centroids = [];  // holds park centroid information
var markers_coord  = {};  // associates string representation of marker position with marker
var markers_name   = {};  // associates park name with marker
var map;
var unselectedCircle;
var selectedCircle;

// Initialize the map:
function initMap() 
{
        // read in data and populate initial data structures
        d3.csv("data/matched_parks.csv", function(data) {
            
            // create the map 
            var mapDiv = document.getElementById('map');
            var map = new google.maps.Map(mapDiv, 
            {
                center: {lat: 41.882037, lng: -87.627794},
                zoom: 12,
                disableDoubleClickZoom: true
            });
            map.set('styles', [{
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [
                { visibility: 'on' },
                { hue: '#269900' },
                { lightness: -15 },
                { saturation: 99 }
            ]}]);
            
            unselectedCircle = 
            {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: 'red',
                fillOpacity: 0.0,
                scale: 4,
                strokeColor: 'red',
                strokeWeight: 1
            };
            
            selectedCircle = 
            {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: 'red',
                fillOpacity: 1.0,
                scale: 4,
                strokeColor: 'red',
                strokeWeight: 1
            };
           
           //populate legend
            var legend = document.getElementById('legend');
            
            map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(document.getElementById('legend'));
            
            
            // read in data
            data.forEach(function(d) 
            {
                var elem = {};
                elem.name = d.Survey_Name;
                elem.latLng = {
                    lat: +d.latitude,
                    lng: +d.longitude
                };
                
                // add park centroids to map
                var marker = new google.maps.Marker({
                    position: elem.latLng,
                    map: map,
                    title: elem.name,
                    icon: unselectedCircle
                });
                
                // add click listeners to markers
                marker.addListener('click', function(e) 
                {
                    var park_name = marker.title;
                    var index = selected_park_names.indexOf(park_name);
                    if(index == -1)
                    {
                        selected_park_names.push(park_name);
                        markers_coord[park_name].setIcon(selectedCircle);
                    }    
                    else
                    {               
                        selected_park_names.splice(index,1);
                        markers_coord[park_name].setIcon(unselectedCircle);
                    }
                    
                    // Change the multi select on the left
                    $('#park_names').val(selected_park_names).trigger("change");  
                    
                    // Change the data series
                    createNewDataSeries();
                    
                    // Change the draggable park label div
                    attachParkNames(selected_park_names);
                    
                    // Redraw the chart
                    drawChart();
                });
                
                // insert into data structures
                park_centroids.push(elem);
                markers_coord[marker.title] = marker;
                markers_name[marker.getTitle()] = marker;
            });
            
            // add a listener to change marker visibility based on zoom level
            google.maps.event.addListener(map, 'zoom_changed', function() 
            {
                var zoom = map.getZoom();
                // iterate over markers and call setVisible
                park_centroids.forEach(function(d){
                    markers_name[d.name].setVisible(zoom >= 12);    
                });
            });

            
            // add double click listener to map for rectangle selection
            map.addListener('dblclick', function(e)
            {
                var bounds = 
                {
                    north: e.latLng.lat() + 0.005,
                    south: e.latLng.lat() - 0.005,
                    east:  e.latLng.lng() + 0.005,
                    west:  e.latLng.lng() - 0.005
                 };

                // define the rectangle and set its editable property
                var rectangle = new google.maps.Rectangle({
                    bounds: bounds,
                    editable: true,
                    draggable: false
                });

                rectangle.setMap(map);
                
                // Add an event listeners on the rectangle.
                rectangle.addListener('bounds_changed', function() {

                    var b = rectangle.getBounds();
                    
                    var c_lat = park_centroids.filter(function(v) {
                        return (v.latLng.lat >= b.getSouthWest().lat()) && (v.latLng.lat <= b.getNorthEast().lat());
                    });
                    
                    var c_lng = park_centroids.filter(function(v) {
                        return (v.latLng.lng >= b.getSouthWest().lng()) && (v.latLng.lng <= b.getNorthEast().lng());
                    });
                    
                    var overlap = c_lat.filter(function(v) {
                        return c_lng.indexOf(v) > -1;
                    });
                    
                    var rect_parks = overlap.map(function(d) 
                    {
                        return d.name;
                    });
                          
                    rect_parks.forEach(function(d) 
                    {
                        if(selected_park_names.indexOf(d) == -1)
                        {
                            selected_park_names.push(d);
                            markers_name[d].setIcon(selectedCircle);
                        }    
                    }); 
                    
                    // Change the multi select on the left
                    $('#park_names').val(selected_park_names).trigger("change");            

                    // Create new data series
                    createNewDataSeries();
                    
                    // Update the draggable park label div
                    attachParkNames(selected_park_names);
                    
                    // redraw the chart
                     drawChart();
                            
                    rectangle.setMap(null);
                });
                
                rectangle.addListener('dblclick', function(e) 
                {
                    rectangle.setMap(null);
                });
            });
        });
}

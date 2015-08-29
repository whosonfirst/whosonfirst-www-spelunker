var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.spelunker = (function(){

	var self = {
		
		'toggle_data_endpoint': function(placetype){

			// mapzen.whosonfirst.data.endpoint('https://s3.amazonaws.com/whosonfirst.mapzen.com/data/');

			var host = location.host;
			var root = "https://" + host + "/";

			if (placetype == 'venue'){
				mapzen.whosonfirst.data.endpoint(root + 'venues/');
			}

			else {
				mapzen.whosonfirst.data.endpoint(root + 'data/');
			}
		},

		'draw_list': function(classname){

			var locs = document.getElementsByClassName(classname);
			var count = locs.length;
			
			var swlat = undefined;
			var swlon = undefined;
			var nelat = undefined;
			var nelon = undefined;
			
			var features = [];
			
			for (var i=0; i < count; i++){
				
				var loc = locs[i];
				var lat = loc.getAttribute("data-latitude");
				var lon = loc.getAttribute("data-longitude");
				
				var anchor = loc.getElementsByTagName("a");
				anchor = anchor[0];			  
				var name = anchor.textContent;
				
				if ((! swlat) || (lat < swlat)){
					swlat = lat;
				}					

				if ((! swlon) || (lat < swlon)){
					swlon = lon;
				}					

				if ((! nelat) || (lat > nelat)){
					nelat = lat;
				}					

				if ((! nelon) || (lat < nelon)){
					nelon = lon;
				}					

				var geom = { 'type': 'Point', 'coordinates': [ lon, lat ] };
				var props = { 'lflt:label_text': name };
				
				var feature = {'type': 'Feature', 'geometry': geom, 'properties': props };					
				features.push(feature);		
			}

			var geojson = { 'type': 'FeatureCollection', 'features': features };
			var map = L.map('map');
			
			map.fitBounds([[swlat, swlon], [ nelat, nelon ]]);
			
			var scene = "/static/tangram/scene.yaml";
			
			var tangram = Tangram.leafletLayer({
				scene: scene,
				numWorkers: 2,
        			unloadInvisibleTiles: false,
				updateWhenIdle: false
			});
			
			tangram.addTo(map);
			
			var style = mapzen.whosonfirst.leaflet.styles.search_centroid();

			// sudo put in a library...
			var handler = function (feature, latlng) {
					
				var m = L.circleMarker(latlng, style);
				
				// https://github.com/Leaflet/Leaflet.label
				
				try {
					var props = feature['properties'];
					var label = props['lflt:label_text'];
					
					if (label){
						m.bindLabel(label, { noHide: false });
					}
				}
				
				catch (e){
					console.log("failed to bind label because " + e);
				}
				
				return m;
			};
			
			var layer = L.geoJson(geojson, {
				'style': style,
				'pointToLayer': handler,
			});
			
			layer.addTo(map);
		}
	};

	return self;
})();

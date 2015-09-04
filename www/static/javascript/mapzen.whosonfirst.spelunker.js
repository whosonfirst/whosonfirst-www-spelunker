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

			var map = mapzen.whosonfirst.leaflet.tangram.map_with_bbox('map', swlat, swlon, nelat, nelon);
			
			var style = mapzen.whosonfirst.leaflet.styles.search_centroid();
			var handler = mapzen.whosonfirst.leaflet.handlers.point(style);

			var layer = L.geoJson(geojson, {
				'style': style,
				'pointToLayer': handler,
			});
			
			layer.addTo(map);
		},

		'draw_names': function(cls){

			var locs = document.getElementsByClassName(cls);  
			var count = locs.length;
			
			for (var i=0; i < count; i++){
				var loc = locs[i];
				var id = loc.getAttribute("data-value");
				
				if (! id){
					continue;
				}
				
				var url = mapzen.whosonfirst.data.id2abspath(id);
				console.log(url);
				
				var cb = function(feature){
					var props = feature['properties'];
					var name = props['wof:name'];
					var id = props['wof:id'];
					
					var _id = cls + "_" + id;
					console.log("set name for " + _id + " to " + name);
					var el = document.getElementById(_id);
					el.innerHTML = name;		    
				};		       
				
				mapzen.whosonfirst.net.fetch(url, cb);		    
			}
		}
	};

	return self;
})();

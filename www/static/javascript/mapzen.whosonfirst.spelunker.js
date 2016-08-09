var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.spelunker = (function(){

	var self = {

	    // this is invoked by by mapzen.whosonfirst.spelunker.init.js
	    // which is running code (20160202/thisisaaronland)

	    'init': function(){
		mapzen.whosonfirst.config.init();

		var m = mapzen.whosonfirst.leaflet.tangram.map('map');
		console.log(m);
	    },

	    'abs_root_url': function(){
		var body = document.body;
		return body.getAttribute("data-abs-root-url");
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
				var id = loc.getAttribute("data-id");
				
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
				var props = { 'lflt:label_text': name, 'wof:id': id };
				
				var feature = {'type': 'Feature', 'geometry': geom, 'properties': props, 'id': id };					
				features.push(feature);		
			}

			// Just draw Null Island and be done with yeah?

			if (swlat == 0.0 && swlon == 0.0 && nelat == 0.0 && nelon == 0.0){

			    var map = mapzen.whosonfirst.leaflet.tangram.map_with_bbox('map', swlat, swlon, nelat, nelon);

			    var on_fetch = function(feature){
				
				var bbox = mapzen.whosonfirst.geojson.derive_bbox(feature);
				var sw = [ bbox[0], bbox[1] ]
				var ne = [ bbox[2], bbox[3] ]

				map.fitBounds([ sw, ne ]);

				mapzen.whosonfirst.enmapify.render_feature_outline(map, feature);
			    };
    
			    mapzen.whosonfirst.enmapify.render_id(map, 1, on_fetch);
			    return;
			}

			// Okay, draw some points

			var geojson = { 'type': 'FeatureCollection', 'features': features };

			var map = mapzen.whosonfirst.leaflet.tangram.map_with_bbox('map', swlat, swlon, nelat, nelon);
			
			var style = mapzen.whosonfirst.leaflet.styles.search_centroid();
			var handler = mapzen.whosonfirst.leaflet.handlers.point(style);

			var oneach = function(feature, layer){
				layer.on('click', function(e){
					var props = feature['properties'];
					var id = props['wof:id'];
					id = encodeURIComponent(id);
					var root = mapzen.whosonfirst.spelunker.abs_root_url();
					var url = root + "id/" + id + "/";
					location.href = url;
				});
			};

			var layer = L.geoJson(geojson, {
				'style': style,
				'pointToLayer': handler,
				'onEachFeature': oneach,
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
				
				var cb = function(feature){
					var props = feature['properties'];
					var name = props['wof:name'];
					var id = props['wof:id'];
					
					var cls_id = cls + "_" + id;

					mapzen.whosonfirst.log.info("assign name for ID " + id + " to be " + name + " for " + cls_id);

					var els = document.getElementsByClassName(cls_id);  
					var count_els = els.length;

					for (var j=0; j < count_els; j++){
						var el = els[j];
						el.innerHTML = mapzen.whosonfirst.php.htmlspecialchars(name) + " <code><small>" + mapzen.whosonfirst.php.htmlspecialchars(id) + "</small></code>";
					}
				};		       
				
				mapzen.whosonfirst.net.fetch(url, cb);		    
			}
		},

	};

	return self;
})();

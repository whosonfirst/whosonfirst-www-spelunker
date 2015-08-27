var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.enmapify = (function(){

		var self = {
			'render_id': function(map, wofid){

				var _self = self;

				if (! wofid){
					console.log("missing WOF ID");
					return false;
				}
				
				var on_fetch = function(geojson){
					self.render_feature(map, geojson);
				};

				var url = mapzen.whosonfirst.data.id2abspath(wofid);
				mapzen.whosonfirst.net.fetch(url, on_fetch);
			},

			'render_feature': function(map, feature){

				mapzen.whosonfirst.leaflet.fit_map(map, feature);

				var props = feature['properties'];
				
				var child_id = props['wof:id'];
				var parent_id = props['wof:parent_id'];
				
				var child_url = mapzen.whosonfirst.data.id2abspath(child_id);
				var parent_url = mapzen.whosonfirst.data.id2abspath(parent_id);
				
				var on_parent = function(parent_feature){
					
					var style = {
						"color": "#ffff00",
						"weight": 3,
						"opacity": 1,
						"fillOpacity": 0.8
					};
					
					mapzen.whosonfirst.leaflet.fit_map(map, parent_feature);
					mapzen.whosonfirst.leaflet.draw_poly(map, parent_feature, style);
					
					mapzen.whosonfirst.net.fetch(child_url, on_child);			
				};
	
				var on_child = function(child_feature){
		
					var style = {
						"color": "#ff69b4",
						"weight": 3,
						"opacity": 1,
						"fillOpacity": 0.8
					};
					
					mapzen.whosonfirst.leaflet.fit_map(map, child_feature);
					mapzen.whosonfirst.leaflet.draw_poly(map, child_feature, style);
		
					var props = child_feature['properties'];
					var lat = props['geom:latitude'];
					var lon = props['geom:longitude'];
					
					var pt = {
						'type': 'Feature',
						'geometry': { 'type': 'Point', 'coordinates': [ lon, lat ] }
					};
					
					mapzen.whosonfirst.leaflet.draw_point(map, pt);

					if ((props['lbl:latitude']) && (props['lbl:longitude'])){

						var lat = props['lbl:latitude'];
						var lon = props['lbl:longitude'];
					
						var pt = {
							'type': 'Feature',
							'geometry': { 'type': 'Point', 'coordinates': [ lon, lat ] }
						};

						var style = {
							"color": "#fff",
							"weight": 3,
							"opacity": 1,
							"radius": 12,
							"fillColor": "#ff0000",
							"fillOpacity": 0.5
						};
					
						mapzen.whosonfirst.leaflet.draw_point(map, pt, style);
					}
				}
	
				if ((! parent_id) || (parent_id == -1)){
					mapzen.whosonfirst.net.fetch(child_url, on_child);
				}
				
				else {
					mapzen.whosonfirst.net.fetch(parent_url, on_parent);
				}
			},

			'enmapify_feature': function(map, collection){
				// please write me
			}
		};

		return self;

})();

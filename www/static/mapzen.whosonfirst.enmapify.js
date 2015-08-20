function mapzen_whosonfirst_enmapify(map, wofid){

	if (! wofid){
		console.log("missing WOF ID");
		return false;
	}

	var on_fetch = function(geojson){

		mapzen_whosonfirst_leaflet_fit_map(map, geojson);

		var props = geojson['properties'];

		var child_id = props['wof:id'];
		var parent_id = props['wof:parent_id'];

		var child_url = mapzen_whosonfirst_utils_id2abspath(child_id);
		var parent_url = mapzen_whosonfirst_utils_id2abspath(parent_id);

		var on_parent = function(geojson){

			var style = {
				"color": "#ffff00",
				"weight": 3,
				"opacity": 1,
				"fillOpacity": 0.8
			};

			mapzen_whosonfirst_leaflet_fit_map(map, geojson);
			mapzen_whosonfirst_leaflet_draw_poly(map, geojson, style);

			mapzen_whosonfirst_utils_fetch(child_url, on_child);			
		};

		var on_child = function(geojson){

			var style = {
				"color": "#ff69b4",
				"weight": 3,
				"opacity": 1,
				"fillOpacity": 0.8
			};

			mapzen_whosonfirst_leaflet_fit_map(map, geojson);
			mapzen_whosonfirst_leaflet_draw_poly(map, geojson, style);

			var props = geojson['properties'];
			var lat = props['geom:latitude'];
			var lon = props['geom:longitude'];

			var pt = {
				'type': 'Feature',
				'geometry': { 'type': 'Point', 'coordinates': [ lon, lat ] }
			};
			
			mapzen_whosonfirst_leaflet_draw_point(map, pt);
		}

		if (parent_id == -1){
			mapzen_whosonfirst_utils_fetch(child_url, on_child);
		}
		
		else {
			mapzen_whosonfirst_utils_fetch(parent_url, on_parent);
		}
	};

	var url = mapzen_whosonfirst_utils_id2abspath(wofid);
	mapzen_whosonfirst_utils_fetch(url, on_fetch);
}


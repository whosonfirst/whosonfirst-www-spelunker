var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.leaflet = (function(){

	var self = {
		'draw_point': function(map, geojson, style){
			
			if (! style){
				style = self.point_style('default');
			}
			
			// this is still trying to draw a regular (icon) marker
			// for some reason... (20150825/thisisaaronland)
			
			var layer = L.geoJson(geojson, {
				'style': style,
				'pointToLayer': function (feature, latlng) {
					
					var m = L.circleMarker(latlng, style);
					
					// https://github.com/Leaflet/Leaflet.label
					
					try {
						var label = latlng.lat + ", " + latlng.lng;
						m.bindLabel(label, { noHide: false });
					}
					
					catch (e){
						console.log("failed to bind label because " + e);
					}
					
					return m;
				}
			});
			
			layer.addTo(map);
		},
		
		'draw_poly': function(map, geojson, style){
			
			if (! style){
				style = self.poly_style('default');
			}
				
			var layer = L.geoJson(geojson, {
				'style': style				
			});
			
			// https://github.com/Leaflet/Leaflet.label
			
			try {
				var props = geojson['properties'];
				var name = props['wof:name'];
				layer.bindLabel(name, {noHide: true });
			}
			
			catch (e){
				console.log("failed to bind label because " + e);
			}
			
			layer.addTo(map);
		},
		
		'draw_bbox': function(map, geojson, style){
		
			if (! geojson['bbox']){
				console.log("please to implement derive bbox code");
				return false;
			}

			var bbox = geojson['bbox'];
			var swlat = bbox[1];
			var swlon = bbox[0];
			var nelat = bbox[3];
			var nelon = bbox[2];

			var geom = {
				'type': 'Polygon',
				'coordinates': [[
					[swlon, swlat],
					[swlon, nelat],
					[nelon, nelat],
					[nelon, swlat],
					[swlon, swlat],
				]]
			};

			var bbox_geojson = {
				'type': 'Feature',
				'geometry': geom
			}

			return self.draw_poly(map, bbox_geojson, style);
		},

		'fit_map': function(map, geojson){
			
			var bbox = mapzen.whosonfirst.geojson.derive_bbox(geojson);
			
			if (! bbox){
				console.log("no bounding box");
				return false;
			}
			
			// var bbox = geojson['bbox'];
			
			if ((bbox[1] == bbox[3]) && (bbox[2] == bbox[4])){
				map.setView([bbox[1], bbox[0]], 14);
				return;
			}
			
			var sw = [bbox[1], bbox[0]];
			var ne = [bbox[3], bbox[2]];
			
			var bounds = new L.LatLngBounds([sw, ne]);
			var current = map.getBounds();
			
			var redraw = false;
			
			if (bounds.getSouth() > current.getSouth()){
				redraw = true;
			}
			
			else if (bounds.getWest() > current.getWest()){
				redraw = true;
			}
			
			else if (bounds.getNorth() < current.getNorth()){
				redraw = true;
			}
			
			else if (bounds.getEast() < current.getEast()){
				redraw = true;
			}
			
			else {}
			
			if (redraw){
				map.fitBounds(bounds);
			}
		},
		
		'point_style': function(context){
			
			return {
				"color": "#fff",
				"weight": 3,
				"opacity": 1,
				"radius": 8,
				"fillColor": "#ff7800",
				"fillOpacity": 0.5
			};
		},

		'poly_style': function(context){

			return {
				"color": "#ff7800",
				"weight": 3,
				"opacity": 1
			};
		}
	};
	
	return self;
})();

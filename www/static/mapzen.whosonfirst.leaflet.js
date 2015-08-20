function mapzen_whosonfirst_leaflet_draw_point(map, geojson, style){

	if (! style){
		style = {
			"color": "#fff",
			"weight": 3,
			"opacity": 1,
			"radius": 5,
			"fillOpacity": 0.5
		};
	}

	var layer = L.geoJson(geojson, {
		'style': style,
		'pointToLayer': function (feature, latlng) {
	            return L.circleMarker(latlng, style);
		}
	});

	layer.addTo(map);
}

function mapzen_whosonfirst_leaflet_draw_poly(map, geojson, style){

	if (! style){
		style = {
			"color": "#ff7800",
			"weight": 3,
			"opacity": 1
		};
	}

	var layer = L.geoJson(geojson, {
		'style': style
	});

	layer.addTo(map);
}

function mapzen_whosonfirst_leaflet_fit_map(map, geojson){

	var bbox = geojson['bbox'];

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
}

var whosonfirst_cache = {};

function whosonfirst_enmapify(map, wofid){

	if (! wofid){
		console.log("missing WOF ID");
		return false;
	}

	var on_fetch = function(geojson){

		whosonfirst_fit_map(map, geojson);

		var props = geojson['properties'];

		var child_id = props['wof:id'];
		var parent_id = props['wof:parent_id'];

		var child_url = whosonfirst_id2abspath(child_id);
		var parent_url = whosonfirst_id2abspath(parent_id);

		var on_parent = function(geojson){

			var style = {
				"color": "#ffff00",
				"weight": 3,
				"opacity": 1,
				"fillOpacity": 0.8
			};

			whosonfirst_fit_map(map, geojson);
			whosonfirst_draw_poly(map, geojson, style);

			whosonfirst_fetch(child_url, on_child);			
		};

		var on_child = function(geojson){

			var style = {
				"color": "#ff69b4",
				"weight": 3,
				"opacity": 1,
				"fillOpacity": 0.8
			};

			whosonfirst_fit_map(map, geojson);
			whosonfirst_draw_poly(map, geojson, style);

			var props = geojson['properties'];
			var lat = props['geom:latitude'];
			var lon = props['geom:longitude'];

			var pt = {
				'type': 'Feature',
				'geometry': { 'type': 'Point', 'coordinates': [ lon, lat ] }
			};
			
			whosonfirst_draw_point(map, pt);
		}

		if (parent_id == -1){
			whosonfirst_fetch(child_url, on_child);
		}
		
		else {
			whosonfirst_fetch(parent_url, on_parent);
		}
	};

	var url = whosonfirst_id2abspath(wofid);
	whosonfirst_fetch(url, on_fetch);
}

function whosonfirst_draw_point(map, geojson, style){

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

function whosonfirst_draw_poly(map, geojson, style){

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


function whosonfirst_fetch(url, on_success){

	console.log("fetch " + url);

	if (whosonfirst_cache[url]){

		console.log("return " + url + " from cache");

		if (on_success){
			on_success(whosonfirst_cache[url]);
		}
		
		return;
	}

	var req = new XMLHttpRequest();

	req.onload = function(){

		try {
			var geojson = JSON.parse(this.responseText);
		}

		catch (e){
			console.log("failed to parse " + url + ", because " + e);
			// console.log(this.responseText);
			return false;
		}

		whosonfirst_cache[url] = geojson;

		if (on_success){
			on_success(geojson);
		}
	};

        try {				    
		req.open("get", url, true);
		req.send();
        }
				    
        catch(e){
		console.log("failed to fetch " + url + ", because ");
		console.log(e);   
	}
	
}

function whosonfirst_fit_map(map, geojson){

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

function whosonfirst_id2abspath(id){

	var rel_path = whosonfirst_id2relpath(id);
	var abs_path = "https://52.27.138.134/data/" + rel_path;
	
	return abs_path;
}

function whosonfirst_id2relpath(id){

	parent = whosonfirst_id2parent(id);
	fname = whosonfirst_id2fname(id);

	var rel_path = parent + "/" + fname;
	
	return rel_path;
}

function whosonfirst_id2parent(id){

	str_id = new String(id);
	tmp = new Array();

	while (str_id.length){

		var part = str_id.substr(0, 3);
		tmp.push(part);		
		str_id = str_id.substr(3);
	}

	parent = tmp.join("/");
	return parent;
}

function whosonfirst_id2fname(id){
	return id + ".geojson";
}

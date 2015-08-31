var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.data = (function(){

	var _endpoint = "http://whosonfirst.mapzen.com/data/";

	var self = {

		'endpoint': function(e){

			if (e){
				_endpoint = e;
			}

			return _endpoint;
		},

		'id2abspath': function (id){

			var rel_path = self.id2relpath(id);
			var abs_path = self.endpoint() + rel_path;
	
			return abs_path;
		},

		'id2relpath': function(id){

			parent = self.id2parent(id);
			fname = self.id2fname(id);

			var rel_path = parent + "/" + fname;
			return rel_path;
		},

		'id2parent': function(id){

			str_id = new String(id);
			tmp = new Array();

			while (str_id.length){
				
				var part = str_id.substr(0, 3);
				tmp.push(part);		
				str_id = str_id.substr(3);
			}
			
			parent = tmp.join("/");
			return parent;
		},

		'id2fname': function(id){
			return id + ".geojson";
		}
	};

	return self;

})();
var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.geojson = (function(){

	var self = {

		'derive_bbox': function(geojson){

			if (geojson['bbox']){
				return geojson['bbox'];
			}
			
			if (geojson['type'] == 'FeatureCollection'){
				
				var features = geojson['features'];
				var count = features.length;
				
				var swlat = undefined;
				var swlon = undefined;
				var nelat = undefined;
				var nelon = undefined;
				
				for (var i=0; i < count; i++){
					
					var bbox = self.derive_bbox(features[i]);
					console.log(bbox);
					var _swlat, _swlon, _nelat, _nelon = bbox;
					
					if ((! swlat) || (_swlat < swlat)){
						swlat = _swlat;
					}
					
					if ((! swlon) || (_swlon < swlon)){
						swlon = _swlon;
					}
					
					if ((! nelat) || (_nelat > nelat)){
						nelat = _nelat;
					}
					
					if ((! nelon) || (_nelon > nelon)){
						nelon = _nelon;
					}
				}
				
				return [ swlat, swlon, nelat, nelon ];
			}
			
			else if (geojson['type'] == 'Feature'){
				
				var geom = geojson['geometry'];
				
				// 
			}
			
			else {}
		}

	};

	return self;

})();
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
				
				mapzen.whosonfirst.leaflet.fit_map(map, parent_feature);
				
				parent_feature['properties']['lflt:label_text'] = parent_feature['properties']['wof:name'];
				mapzen.whosonfirst.leaflet.draw_poly(map, parent_feature, mapzen.whosonfirst.leaflet.styles.parent_polygon());
				
				mapzen.whosonfirst.net.fetch(child_url, on_child);			
			};
			
			var on_child = function(child_feature){
				
				mapzen.whosonfirst.leaflet.fit_map(map, child_feature);
				
				child_feature['properties']['lflt:label_text'] = "";
				mapzen.whosonfirst.leaflet.draw_bbox(map, child_feature, mapzen.whosonfirst.leaflet.styles.bbox());
				
				child_feature['properties']['lflt:label_text'] = child_feature['properties']['wof:name'];
				mapzen.whosonfirst.leaflet.draw_poly(map, child_feature, mapzen.whosonfirst.leaflet.styles.consensus_polygon());
				
				var props = child_feature['properties'];
				var lat = props['geom:latitude'];
				var lon = props['geom:longitude'];
				
				var label_text = 'math centroid (shapely) is ';
				label_text += lat + ", " + lon;
				
				var pt = {
					'type': 'Feature',
					'geometry': { 'type': 'Point', 'coordinates': [ lon, lat ] },
					'properties': { 'lflt:label_text': label_text }
				};
				
				var style = mapzen.whosonfirst.leaflet.styles.math_centroid();
				var handler = mapzen.whosonfirst.leaflet.handlers.point(style);

				mapzen.whosonfirst.leaflet.draw_point(map, pt, style, handler);
				
				if ((props['lbl:latitude']) && (props['lbl:longitude'])){
					
					var lat = props['lbl:latitude'];
					var lon = props['lbl:longitude'];
					
					var label_src = props['src:lbl:centroid'] || props['src:centroid_lbl'] || "UNKNOWN";
					
					var label_text = "label centroid (";
					label_text += label_src;
					label_text += ") is ";
					label_text += lat + ", " + lon;
					
					var pt = {
						'type': 'Feature',
						'geometry': { 'type': 'Point', 'coordinates': [ lon, lat ] },
						'properties': { 'lflt:label_text': label_text },
					};
					
					mapzen.whosonfirst.leaflet.draw_point(map, pt, mapzen.whosonfirst.leaflet.styles.label_centroid());
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
var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.leaflet = (function(){

	var self = {
		'draw_point': function(map, geojson, style, handler){
			
			// this is still trying to draw a regular (icon) marker
			// for some reason... (20150825/thisisaaronland)
			
			var layer = L.geoJson(geojson, {
				'style': style,
				'pointToLayer': handler
			});
			
			layer.addTo(map);
		},
		
		'draw_poly': function(map, geojson, style){
			
			var layer = L.geoJson(geojson, {
				'style': style				
			});
			
			// https://github.com/Leaflet/Leaflet.label
			
			try {
				var props = geojson['properties'];
				var label = props['lflt:label_text'];

				if (label){
					layer.bindLabel(label, {noHide: true });
				}
			}
			
			catch (e){
				console.log("failed to bind label because " + e);
			}
			
			layer.addTo(map);
		},
		
		'draw_bbox': function(map, geojson, style){

			var bbox = mapzen.whosonfirst.geojson.derive_bbox(geojson);
			
			if (! bbox){
				console.log("no bounding box");
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
	};
	
	return self;
})();
var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};
mapzen.whosonfirst.leaflet = mapzen.whosonfirst.leaflet || {};

mapzen.whosonfirst.leaflet.styles = (function(){

	var self = {

		'bbox': function(){
			return {
				"color": "#000000",
				"weight": .5,
				"opacity": 1,
				"fillColor": "#000000",
				"fillOpacity": .4,
			};
		},

		'label_centroid': function(){

			return {
				"color": "#fff",
				"weight": 3,
				"opacity": 1,
				"radius": 10,
				"fillColor": "#ff0099",
				"fillOpacity": 0.8
			};
		},
		
		'math_centroid': function(){

			return {
				"color": "#fff",
				"weight": 2,
				"opacity": 1,
				"radius": 6,
				"fillColor": "#ff7800",
				"fillOpacity": 0.8
			};
		},

		'search_centroid': function(){

			return {
				"color": "#fff",
				"weight": 2,
				"opacity": 1,
				"radius": 6,
				"fillColor": "#000ccc",
				"fillOpacity": 0.8
			};
		},
		
		'consensus_polygon': function(){

			return {
				"color": "#ff0066",
				"weight": 2,
				"opacity": 1,
				"fillColor": "#ff69b4",
				"fillOpacity": 0.6
			};
		},

		'parent_polygon': function(){

			return {
				"color": "#ffff00",
				"weight": 3,
				"opacity": 1,
				"fillOpacity": 0.8
			};
		}
	};

	
	return self;
})();
var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};
mapzen.whosonfirst.leaflet = mapzen.whosonfirst.leaflet || {};

mapzen.whosonfirst.leaflet.handlers = (function(){

	var self = {

		'point': function(style){

			return function(feature, latlon){

				var m = L.circleMarker(latlon, style);
				
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
		},
	};
	
	return self;
})();
var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};
mapzen.whosonfirst.leaflet = mapzen.whosonfirst.leaflet || {};

mapzen.whosonfirst.leaflet.tangram = (function(){

	var _scenefile = '/static/tangram/scene.yaml'
	var _cache = {};

	var self = {

		'map_with_bbox': function(id, swlat, swlon, nelat, nelon){

			if ((swlat == nelat) && (swlon == nelon)){
				return self.map_with_latlon(id, swlat, swlon, 14);
			}

			var map = self.map(id);
			map.fitBounds([[swlat, swlon], [ nelat, nelon ]]);

			return map;
		},

		'map_with_latlon': function(id, lat, lon, zoom){

			var map = self.map(id);
			map.setView([ lat , lon ], zoom);

			return map;
		},
		
		'map': function(id){

			if (! _cache[id]){
				var map = L.map(id);

				var tangram = self.tangram();
				tangram.addTo(map);

				_cache[id] = map;
			}

			return _cache[id];
		},

		'tangram': function(scene){

			var scene = self.scenefile();

			var tangram = Tangram.leafletLayer({
				scene: scene,
				numWorkers: 2,
        			unloadInvisibleTiles: false,
				updateWhenIdle: false
			});
			
			return tangram;
		},

		'scenefile': function(url){

			if (url){
				_scenefile = url;
			}

			return _scenefile;
		}
	};

	return self;
})();
var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.net = (function(){

	var whosonfirst_cache = {};

	var self = {

		'encode_query': function(query){

			enc = new Array();

			for (var k in query){
				var v = query[k];
				v = encodeURIComponent(v);
				enc.push(k + "=" + v);
			}
			
			return enc.join("&");
		},

		'fetch': function(url, on_success){

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
		},

	};

	return self;

})();
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
		}
	};

	return self;
})();

// last bundled at 2015-08-31T19:01:00 UTC

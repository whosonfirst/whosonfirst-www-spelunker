var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.log = (function(){

	var _log = [];

	var self = {

		'show': function(){
			self.toggle(true);
		},

		'hide': function(){
			self.toggle(false);
		},

		'toggle': function(show){

			var c = document.getElementById('wof-log-container');
			
			if (! c){
				return false;
			}

			var style = (show) ? "display:block" : "display:none";
			c.setAttribute("style", style);
		},

		'debug': function(msg){
			self.log(msg, 'debug');
		},

		'info': function(msg){
			self.log(msg, 'info');
		},

		'warning': function(msg){
			self.log(msg, 'warning');
		},

		'error': function(msg){
			self.log(msg, 'error');
		},

		'log': function(msg, cls){

			var dt = new Date();

			_log.push([cls, msg, dt]);

			var el = self._render(msg, cls, dt);
			self._attach(el);
			self.show();
		},
		
		'_render': function(msg, cls, dt){

			var enc_msg = htmlspecialchars(msg);
			var enc_cls = htmlspecialchars(cls);

			var item = document.createElement("li");
			item.setAttribute("class", "wof-log-item wof-log-" + enc_cls);

			var text = document.createTextNode(enc_msg);

			var span = document.createElement("span");
			span.setAttribute("class", "wof-log-body");
			span.appendChild(text);

			var ts = dt.toISOString();
			ts = htmlspecialchars(ts);
			ts = document.createTextNode(ts + " " + cls);

			var code = document.createElement("code");
			code.setAttribute("class", "wof-log-ts");
			code.appendChild(ts);

			item.appendChild(code);
			item.appendChild(span);

			return item;
		},
		
		'_attach': function(el){

			var n = document.getElementById('wof-log');

			if (! n){
				console.log("faile to locate #wof-log container");
				return false;
			}

			n.insertBefore(el, n.childNodes[0]);
			return true;
		}
	};
	
	return self;

})();
var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.placetypes = (function(){

	// Generated from: https://github.com/whosonfirst/whosonfirst-placetypes/blob/master/bin/compile.py

	var __spec__ = {"102312321": {"role": "optional", "name": "microhood", "parent": [102312319], "names": {}}, "102312323": {"role": "optional", "name": "macrohood", "parent": [102312317], "names": {}}, "102312325": {"role": "common_optional", "name": "venue", "parent": [102312327, 102312329, 102312331, 102312321, 102312319], "names": {}}, "102312327": {"role": "common_optional", "name": "building", "parent": [102312329, 102312331, 102312321, 102312319], "names": {}}, "102312329": {"role": "common_optional", "name": "address", "parent": [102312331, 102312321, 102312319], "names": {}}, "102312319": {"role": "common", "name": "neighbourhood", "parent": [102312323, 102312317], "names": {"eng_p": ["neighbourhood", "neighborhood"]}}, "102312331": {"role": "common_optional", "name": "campus", "parent": [102312321, 102312319], "names": {}}, "102312309": {"role": "common", "name": "continent", "parent": [102312341], "names": {}}, "102371933": {"role": "optional", "name": "metroarea", "parent": [], "names": {}}, "102312307": {"role": "common", "name": "country", "parent": [102312335, 102312309], "names": {}}, "102312335": {"role": "common_optional", "name": "empire", "parent": [102312309], "names": {}}, "102312341": {"role": "common_optional", "name": "planet", "parent": [], "names": {}}, "102312311": {"role": "common", "name": "region", "parent": [102320821, 102322043, 102312307], "names": {}}, "102312313": {"role": "common_optional", "name": "county", "parent": [102312311], "names": {}}, "102322043": {"role": "common_optional", "name": "disputed", "parent": [102312307], "names": {}}, "102312317": {"role": "common", "name": "locality", "parent": [102312313, 102312311], "names": {}}, "136057795": {"role": "common_optional", "name": "timezone", "parent": [102312307, 102312309, 102312341], "names": {}}, "102320821": {"role": "common_optional", "name": "dependency", "parent": [102312307], "names": {}}};

	var __placetypes__ = {};
	var __roles__ = {};

	for (var id in __spec__){

		var details = __spec__[id];
		var name = details['name'];
		var role = details['role'];
		var parents = [];

		var count_pids = details['parent'].length;

		for (var p=0; p < count_pids; p++){
			var pid = details['parent'][p];
			var parent = __spec__[pid];
			parents.push(parent['name']);
		}

		__placetypes__[name] = {
			'id': id,
			'role': role,
			'parent': parents
		}

		var names = details['names'] || {};
		__placetypes__[name]['names'] = names;

		for (var label in names){

			if (! label.endsWith("_p")){
				continue;
			}

			var alts = names[label];
			var count_alts = alts.length;

			for (var c=0; c < count_alts; c++){

				var alt = alts[c];

				if (! __placetypes__[alt]){
					__placetypes__[alt] = __placetypes__[name];
				}
			}
		}

		if (! __roles__[role]){
			__roles__[role] = {};
		}
	}

	var self = {
		
		'placetypename': function(labe, name){
			
			// please write me
		},
		
		'placetype': function(pt){

			if (! self.is_valid_placetype(pt)){
				return undefined;
			}

			// please write me
		},

		'is_valid_placetype': function(pt, role){

			if (! __placetypes__[pt]){
				return false;
			}

			if ((role) && (__placetypes__[pt]['role'] != role)){
				return false;
			}

			return true;
		},

		'common': function(){
			return self.with_role('common');
		},

		'common_optional': function(){
			return self.with_role('common_optional');
		},

		'optional': function(){
			return self.with_role('optional');
		},

		'is_valid_role': function(role){

			if (! __roles__[role]){
				return false;
			}

			return true;
		},

		'with_role': function(role){
			var roles = [role];
			return self.with_roles(roles);
		},

		'with_roles': function(roles){
			
			var placetypes = [];

			for (var pt in __placetypes__){

				var details = __placetypes__[pt];
				var role = details['role'];

				if (! role){
					continue;
				}

				if (roles.indexOf(role) == -1){
					continue;
				}

				placetypes.push(pt);
			}

			return placetypes;
		},
	};

	return self;
})();
var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.data = (function(){

	var _endpoint = "http://whosonfirst.mapzen.com/data/";

	var self = {

		'endpoint': function(e){

			if (e){
				mapzen.whosonfirst.log.info("set data endpoint to " + e);
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

mapzen.whosonfirst.leaflet = (function(){

	var self = {
		'draw_point': function(map, geojson, style, handler){
						
			var layer = L.geoJson(geojson, {
				'style': style,
				'pointToLayer': handler,
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

		'fit_map': function(map, geojson, force){
			
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

			var redraw = true;

			if (! force){

				var redraw = false;

				/*
				  console.log("south bbox: " + bounds.getSouth() + " current: " + current.getSouth().toFixed(6));
				  console.log("west bbox: " + bounds.getWest() + " current: " + current.getWest().toFixed(6));
				  console.log("north bbox: " + bounds.getNorth() + " current: " + current.getNorth().toFixed(6));
				  console.log("east bbox: " + bounds.getEast() + " current: " + current.getEast().toFixed(6));
				*/
				
				if (bounds.getSouth() <= current.getSouth().toFixed(6)){
					redraw = true;
				}
				
				else if (bounds.getWest() <= current.getWest().toFixed(6)){
					redraw = true;
				}
				
				else if (bounds.getNorth() >= current.getNorth().toFixed(6)){
					redraw = true;
				}
				
				else if (bounds.getEast() >= current.getEast().toFixed(6)){
					redraw = true;
				}
				
				else {}
			}
			
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

		'geom_centroid': function(){

			return {
				"color": "#fff",
				"weight": 3,
				"opacity": 1,
				"radius": 10,
				"fillColor": "#32cd32",
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

		'breach_polygon': function(){

			return {
				"color": "#002EA7",
				"weight": 2,
				"opacity": 1,
				"fillColor": "#002EA7",
				"fillOpacity": 0.1
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
				map.scrollWheelZoom.disable();

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

		'fetch': function(url, on_success, on_fail){

			mapzen.whosonfirst.log.debug("fetch " + url);

			if (whosonfirst_cache[url]){
				
				mapzen.whosonfirst.log.debug("return " + url + " from cache");
				
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
					mapzen.whosonfirst.log.error("failed to parse " + url + ", because " + e);

					if (on_fail){
						on_fail();
					}

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
				mapzen.whosonfirst.log.error("failed to fetch " + url + ", because ");
				mapzen.whosonfirst.log.debug(e);   

				if (on_fail){
					on_fail();
				}
			}
		},

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
				mapzen.whosonfirst.log.error("failed to enmapify because missing WOF ID");
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

				var on_fail = function(){
					mapzen.whosonfirst.log.error("failed to render " + parent_url);
					on_child();
				};

				mapzen.whosonfirst.net.fetch(child_url, on_child, on_fail);
			};
			
			var on_child = function(child_feature){

				var props = child_feature['properties'];
				var geom = child_feature['geometry'];

				var lat = props['geom:latitude'];
				var lon = props['geom:longitude'];
				
				var label_text = 'math centroid (shapely) is ';
				label_text += lat + ", " + lon;
				
				var pt = {
					'type': 'Feature',
					'geometry': { 'type': 'Point', 'coordinates': [ lon, lat ] },
					'properties': { 'lflt:label_text': label_text }
				};

				if (geom['type'] == 'Point'){

					var label_text = 'geom centroid (the DATA) is ';
					label_text += lat + ", " + lon;

					pt['properties']['lflt:label_text'] = label_text;

					var style = mapzen.whosonfirst.leaflet.styles.geom_centroid();
					var handler = mapzen.whosonfirst.leaflet.handlers.point(style);

					mapzen.whosonfirst.leaflet.draw_point(map, pt, style, handler);
					return;
				}

				var force = true;
				mapzen.whosonfirst.leaflet.fit_map(map, child_feature, force);

				child_feature['properties']['lflt:label_text'] = "";
				mapzen.whosonfirst.leaflet.draw_bbox(map, child_feature, mapzen.whosonfirst.leaflet.styles.bbox());

				child_feature['properties']['lflt:label_text'] = child_feature['properties']['wof:name'];
				mapzen.whosonfirst.leaflet.draw_poly(map, child_feature, mapzen.whosonfirst.leaflet.styles.consensus_polygon());

				// we're defining this as a local function to ensure that it gets called
				// after any breaches are drawn (20150909/thisisaaronland)

				var draw_centroids = function(){

					// I don't know why this is necessary...
					// (20150909/thisisaaronland)

					if (! pt){
						var lat = props['geom:latitude'];
						var lon = props['geom:longitude'];
						
						var label_text = 'math centroid (shapely) is ';
						label_text += lat + ", " + lon;
						
						var pt = {
							'type': 'Feature',
							'geometry': { 'type': 'Point', 'coordinates': [ lon, lat ] },
							'properties': { 'lflt:label_text': label_text }
						};
					}

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
						
						var style = mapzen.whosonfirst.leaflet.styles.label_centroid();
						var handler = mapzen.whosonfirst.leaflet.handlers.point(style);
						
						mapzen.whosonfirst.leaflet.draw_point(map, pt, style, handler);
					}

				};

				var breaches = props['wof:breaches']
				var count = breaches.length;

				if (! count){
					draw_centroids();
				}

				else {

					for (var i=0; i < count; i++){

						var breach_id = breaches[i];
						var breach_url = mapzen.whosonfirst.data.id2abspath(breach_id);
						
						var breach_style = mapzen.whosonfirst.leaflet.styles.breach_polygon();
						
						var on_fetch = function(breach_feature){
							
							var child_props = child_feature['properties'];
							var child_name = child_props['wof:name'];
							
							var breach_props = breach_feature['properties'];
							var breach_name = breach_props['wof:name'];
							
							var label_text = breach_name + " breaches " + child_name;
							
							props['lflt:label_text'] = label_text;
							breach_feature['properties'] = props;
							
							mapzen.whosonfirst.leaflet.draw_poly(map, breach_feature, breach_style);
							
							if (i == count){
								draw_centroids();
							}
							
						};
						
						mapzen.whosonfirst.net.fetch(breach_url, on_fetch);
					}
				}
									
			}
			
			if ((! parent_id) || (parent_id == -1)){
				mapzen.whosonfirst.net.fetch(child_url, on_child);
			}
			
			else {
				mapzen.whosonfirst.net.fetch(parent_url, on_parent, function(){ on_child() });
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

mapzen.whosonfirst.spelunker = (function(){

	var self = {
		
		'toggle_data_endpoint': function(placetype){

			var host = location.host;
			var root = "//" + host + "/";

			mapzen.whosonfirst.data.endpoint(root + 'data/');
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

			var geojson = { 'type': 'FeatureCollection', 'features': features };

			var map = mapzen.whosonfirst.leaflet.tangram.map_with_bbox('map', swlat, swlon, nelat, nelon);
			
			var style = mapzen.whosonfirst.leaflet.styles.search_centroid();
			var handler = mapzen.whosonfirst.leaflet.handlers.point(style);

			var oneach = function(feature, layer){
				layer.on('click', function(e){
					var props = feature['properties'];
					var id = props['wof:id'];
					id = encodeURIComponent(id);
					var url = "/id/" + id + "/";
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
						el.innerHTML = htmlspecialchars(name) + " <code><small>" + htmlspecialchars(id) + "</small></code>";
					}
				};		       
				
				mapzen.whosonfirst.net.fetch(url, cb);		    
			}
		},

		'render_properties': function(props){

			var render = function(d, ctx){

				// console.log("render context is " + ctx);

				if (Array.isArray(d)){
					return render_list(d, ctx);
				}

				else if (typeof(d) == "object"){
					return render_dict(d, ctx);
				}

				else {

					var possible_wof = [
						'wof-belongsto',
						'wof-parent_id', 'wof-children',
						'wof-breaches',
						'wof-supersedes',
						'wof-superseded_by',
						// TO DO : please to write js-whosonfirst-placetypes...
						'wof-hierarchy-continent_id', 'wof-hierarchy-country_id', 'wof-hierarchy-region_id',
						'wof-hierarchy-county_id', 'wof-hierarchy-locality_id', 'wof-hierarchy-neighbourhood_id',
						'wof-hierarchy-campus_id', 'wof-hierarchy-venue_id'
					];

					if ((ctx) && (d)){

						if ((in_array(ctx, possible_wof)) && (d > 0)){
				
							var link = "/id/" + encodeURIComponent(d) + "/";
							var el = render_link(link, d, ctx);

							var text = el.children[0];
							text.setAttribute("data-value", htmlspecialchars(d));
							text.setAttribute("class", "props-uoc props-uoc-name props-uoc-name_" + htmlspecialchars(d));

							return el;
						}

						else if (ctx == 'wof-id'){
							return render_code(d, ctx);
						}

						else if (ctx == 'wof-placetype'){
							var link = "/placetypes/" + encodeURIComponent(d) + "/";
							return render_link(link, d, ctx);
						}

						else if (ctx == 'wof-concordances-gn:id'){
							var link = "http://geonames.org/" + encodeURIComponent(d) + "/";
							return render_link(link, d, ctx);							
						}

						/*
						else if (ctx == 'wof-concordances-mzb:id'){
							var link = "https://s3.amazonaws.com/osm-polygons.mapzen.com/" + encodeURIComponent(d) + ".tgz";
							return render_link(link, d, ctx);							
						}
						*/

						else if ((ctx == 'wof-concordances-gp:id') || (ctx == 'wof-concordances-woe:id')){
							var link = "https://woe.spum.org/id/" + encodeURIComponent(d) + "/";
							return render_link(link, d, ctx);							
						}

						else if (ctx == 'wof-concordances-tgn:id'){
							var link = "http://vocab.getty.edu/tgn/" + encodeURIComponent(d);
							return render_link(link, d, ctx);
						}

						else if (ctx == 'wof-lastmodified'){
							var dt = new Date(parseInt(d) * 1000);
							return render_text(dt.toISOString(), ctx);
						}
						
						else if ((ctx == 'wof-megacity') && (d == 1)){
							var link = "/megacities/";
							return render_link(link, "HOW BIG WOW MEGA SO CITY", ctx);
						}

						else if (ctx == 'wof-tags'){
							var link = "/tags/" + encodeURIComponent(d) + "/";
							return render_link(link, d, ctx);
						}

						else if ((ctx.match(/^name-/)) || (ctx == 'wof-name')){
							var link = "/search/?q=" + encodeURIComponent(d);
							return render_link(link, d, ctx);
						}

						else if (ctx == 'sg-city'){
							var link = "/search/?q=" + encodeURIComponent(d);
							return render_link(link, d, ctx);
						}

						else if (ctx == 'sg-postcode'){
							var link = "/postalcodes/" + encodeURIComponent(d) + "/";
							return render_link(link, d, ctx);
						}

						else if (ctx == 'sg-tags'){
							var link = "/tags/" + encodeURIComponent(d) + "/";
							return render_link(link, d, ctx);
						}
						
						else if (ctx.match(/^sg-classifiers-/)){
							var link = "/categories/" + encodeURIComponent(d) + "/";
							return render_link(link, d, ctx);
						}

						else {
							return render_text(d, ctx);
						}
					  }

					  else {
						return render_text(d, ctx);
					}
				}
			};

			var render_dict = function(d, ctx){

				var table = document.createElement("table");
				table.setAttribute("class", "table");

				for (k in d){
					var row = document.createElement("tr");
				
					// console.log("render context is " + ctx);

					var label_text = k;

					if (ctx == 'wof-concordances'){

						if (k == 'gn:id'){
							label_text = 'geonames';
						}

						else if ((k == 'gp:id') || (k == 'woe:id')){
							label_text = 'geoplanet';
						}

						else if (k == 'fct:id'){
							label_text = 'factual';
						}

						else if (k == 'tgn:id'){
							label_text = 'tgn (getty)';
						}

						else if (k == 'oa:id'){
							label_text = 'our airports';
						}

						else if (k == 'sg:id'){
							label_text = 'simplegeo';
						}

						else {}

					}

					var header = document.createElement("th");
					var label = document.createTextNode(htmlspecialchars(label_text));
					header.appendChild(label);

					var _ctx = (ctx) ? ctx + "-" + k : k;

					var content = document.createElement("td");
					var body = render(d[k], _ctx);

					content.appendChild(body);

					row.appendChild(header);
					row.appendChild(content);

					table.appendChild(row);
				}

				return table;
			};

			var render_list = function(d, ctx){

				var count = d.length;

				if (count == 0){
					return render_text("–", ctx);
				}

				if (count <= 1){
					return render(d[0], ctx);
				}

				var list = document.createElement("ul");
				
				for (var i=0; i < count; i++){
					
					var item = document.createElement("li");
					var body = render(d[i], ctx);

					item.appendChild(body);
					list.appendChild(item);
				}

				return list;
			};

			var render_editable = function(d){
				// please write me
			};

			var render_text = function(d, ctx){

				var text = htmlspecialchars(d);

				var span = document.createElement("span");
				span.setAttribute("id", ctx);
				span.setAttribute("class", "props-uoc");

				var el = document.createTextNode(text);
				span.appendChild(el);
				return span;
			};

			var render_link = function(link, text, ctx){

				var anchor = document.createElement("a");
				anchor.setAttribute("href", link);
				anchor.setAttribute("target", "_wof");
				var body = render_text(text, ctx);
				anchor.appendChild(body);
				return anchor;
			}

			var render_code = function(text, ctx){

				var code = document.createElement("code");
				var body = render_text(text, ctx);
				code.appendChild(body);
				return code;
			}

			var bucket_props = function(props){

				buckets = {};

				for (k in props){
					parts = k.split(":", 2);

					ns = parts[0];
					pred = parts[1];

					if (parts.length != 2){
						ns = "misc";
						pred = k;
					}

					if (! buckets[ns]){
						buckets[ns] = {};					
					}
					
					buckets[ns][pred] = props[k];
				}
				
				return buckets;
			};

			var sort_bucket = function(bucket){

				var sorted = {};

				var keys = Object.keys(bucket);
				keys = keys.sort();

				var count_keys = keys.length;

				for (var j=0; j < count_keys; j++){
					var k = keys[j];
					sorted[k] = bucket[k];
				}

				return sorted;
			};

			var render_bucket = function(ns, bucket){

				var wrapper = document.createElement("div");

				var header = document.createElement("h3");
				var content = document.createTextNode(ns);
				header.appendChild(content);
			
				var sorted = sort_bucket(bucket);
				var body = render(sorted, ns);
				
				wrapper.appendChild(header);
				wrapper.appendChild(body);

				return wrapper;
			};

			var pretty = document.createElement("div");
			pretty.setAttribute("id", "props-pretty");
			
			buckets = bucket_props(props);

			// these two go first

			wof_bucket = render_bucket('wof', buckets['wof'])
			pretty.appendChild(wof_bucket);
			delete buckets['wof']

			if (buckets['name']){
				name_bucket = render_bucket('name', buckets['name'])
				pretty.appendChild(name_bucket);
				delete buckets['name'];
			}

			// now render the rest of them

			var namespaces = Object.keys(buckets);
			namespaces = namespaces.sort();

			var count_ns = namespaces.length;

			for (var i=0; i < count_ns; i++){

				var ns = namespaces[i]
				var dom = render_bucket(ns, buckets[ns]);
				pretty.appendChild(dom);
			}

			return pretty;
		}
	};

	return self;
})();

// last bundled at 2015-09-11T01:24:29 UTC

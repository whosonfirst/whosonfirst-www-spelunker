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

			var enc_msg = mapzen.whosonfirst.php.htmlspecialchars(msg);
			var enc_cls = mapzen.whosonfirst.php.htmlspecialchars(cls);

			var item = document.createElement("li");
			item.setAttribute("class", "wof-log-item wof-log-" + enc_cls);

			var text = document.createTextNode(enc_msg);

			var span = document.createElement("span");
			span.setAttribute("class", "wof-log-body");
			span.appendChild(text);

			var ts = dt.toISOString();
			ts = mapzen.whosonfirst.php.htmlspecialchars(ts);
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

mapzen.whosonfirst.php = (function(){

	var self = {
		'htmlspecialchars': function(string, quote_style, charset, double_encode){
			//       discuss at: http://phpjs.org/functions/htmlspecialchars/
			//      original by: Mirek Slugen
			//      improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
			//      bugfixed by: Nathan
			//      bugfixed by: Arno
			//      bugfixed by: Brett Zamir (http://brett-zamir.me)
			//      bugfixed by: Brett Zamir (http://brett-zamir.me)
			//       revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
			//         input by: Ratheous
			//         input by: Mailfaker (http://www.weedem.fr/)
			//         input by: felix
			// reimplemented by: Brett Zamir (http://brett-zamir.me)
			//             note: charset argument not supported
			//        example 1: htmlspecialchars("<a href='test'>Test</a>", 'ENT_QUOTES');
			//        returns 1: '&lt;a href=&#039;test&#039;&gt;Test&lt;/a&gt;'
			//        example 2: htmlspecialchars("ab\"c'd", ['ENT_NOQUOTES', 'ENT_QUOTES']);
			//        returns 2: 'ab"c&#039;d'
			//        example 3: htmlspecialchars('my "&entity;" is still here', null, null, false);
			//        returns 3: 'my &quot;&entity;&quot; is still here'
			
			var optTemp = 0,
			i = 0,
			noquotes = false;
			if (typeof quote_style === 'undefined' || quote_style === null) {
				quote_style = 2;
			}
			string = string.toString();
			if (double_encode !== false) {
				// Put this first to avoid double-encoding
				string = string.replace(/&/g, '&amp;');
			}
			string = string.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
			
			var OPTS = {
				'ENT_NOQUOTES'          : 0,
				'ENT_HTML_QUOTE_SINGLE' : 1,
				'ENT_HTML_QUOTE_DOUBLE' : 2,
				'ENT_COMPAT'            : 2,
				'ENT_QUOTES'            : 3,
				'ENT_IGNORE'            : 4
			};
			if (quote_style === 0) {
				noquotes = true;
			}
			if (typeof quote_style !== 'number') {
				// Allow for a single string or an array of string flags
				quote_style = [].concat(quote_style);
				for (i = 0; i < quote_style.length; i++) {
					// Resolve string input to bitwise e.g. 'ENT_IGNORE' becomes 4
					if (OPTS[quote_style[i]] === 0) {
						noquotes = true;
					} else if (OPTS[quote_style[i]]) {
						optTemp = optTemp | OPTS[quote_style[i]];
					}
				}
				quote_style = optTemp;
			}
			if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
				string = string.replace(/'/g, '&#039;');
			}
			if (!noquotes) {
				string = string.replace(/"/g, '&quot;');
			}
			
			return string;
		}
	};

	return self;

})();
var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

// this is an early port of py-mapzen-whosonfirst-placetypes and porting
// all this code to another language may necessitate changes which is not
// the goal of this exercise but useful and all that...
// (21050911/thisisaaronland)

// also this (21050911/thisisaaronland)
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield#Browser_compatibility

mapzen.whosonfirst.placetypes = (function(){

	// __spec__ was generated from: https://github.com/whosonfirst/whosonfirst-placetypes/blob/master/bin/compile.py
        // 20160329

	var __spec__ = {"102312321": {"role": "optional", "name": "microhood", "parent": [102312319], "names": {}}, "421205763": {"role": "common_optional", "name": "borough", "parent": [102312317, 404221409], "names": {}}, "102312325": {"role": "common_optional", "name": "venue", "parent": [102312327, 102312329, 102312331, 102312321, 102312319], "names": {}}, "102312327": {"role": "common_optional", "name": "building", "parent": [102312329, 102312331, 102312321, 102312319], "names": {}}, "102312329": {"role": "common_optional", "name": "address", "parent": [102312331, 102312321, 102312319], "names": {}}, "102312331": {"role": "common_optional", "name": "campus", "parent": [102312321, 102312319, 102312323, 102312317, 404221409], "names": {}}, "404528653": {"role": "common_optional", "name": "ocean", "parent": [102312341], "names": {}}, "102312335": {"role": "common_optional", "name": "empire", "parent": [102312309], "names": {}}, "102312323": {"role": "optional", "name": "macrohood", "parent": [421205763, 102312317], "names": {}}, "102312341": {"role": "common_optional", "name": "planet", "parent": [], "names": {}}, "102320821": {"role": "common_optional", "name": "dependency", "parent": [102312307], "names": {}}, "136057795": {"role": "common_optional", "name": "timezone", "parent": [102312307, 102312309, 102312341], "names": {}}, "404528655": {"role": "common_optional", "name": "marinearea", "parent": [102312307, 102312309, 102312341], "names": {}}, "102371933": {"role": "optional", "name": "metroarea", "parent": [], "names": {}}, "404221409": {"role": "common_optional", "name": "localadmin", "parent": [102312313, 102312311], "names": {}}, "404221411": {"role": "optional", "name": "macroregion", "parent": [102320821, 102322043, 102312307], "names": {}}, "404221413": {"role": "optional", "name": "macrocounty", "parent": [102312311], "names": {}}, "102312307": {"role": "common", "name": "country", "parent": [102312335, 102312309], "names": {}}, "102312309": {"role": "common", "name": "continent", "parent": [102312341], "names": {}}, "102312311": {"role": "common", "name": "region", "parent": [404221411, 102320821, 102322043, 102312307], "names": {}}, "102312313": {"role": "common_optional", "name": "county", "parent": [404221413, 102312311], "names": {}}, "102322043": {"role": "common_optional", "name": "disputed", "parent": [102312307], "names": {}}, "102312317": {"role": "common", "name": "locality", "parent": [404221409, 102312313, 102312311], "names": {}}, "102312319": {"role": "common", "name": "neighbourhood", "parent": [102312323, 421205763, 102312317], "names": {"eng_p": ["neighbourhood", "neighborhood"]}}}


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
		
		'placetypename': function(label, name){

			var instance = function(label, name){
				
				var parts = label.split("_");
				var lang = parts[0];
				var kind = parts[1];

				var _self = {
					'lang': lang,
					'kind': kind,
					'name': name,

					'toString': function(){
						return _self.name;
					}
				};

				return _self;
			};

			return instance(label, name);
		},
		
		'placetype': function(pt){

			if (! self.is_valid_placetype(pt)){
				return undefined;
			}

			var instance = function(pt){

				var _self = {
					'placetype': pt,
					'details': __placetypes__[pt],

					'toString': function(){
						return _self.placetype;
					},

					'id': function(){
						return _self.details['id'];
					},

					'role': function(){
						return _self.details['role'];
					},

					'name': function(){
						return _self.placetype;
					},

					'names': function(){

						var names = [];
						var _names = _self.details['names'];

						for (var label in _names){
							var _alts = _names[label];
							var count = _alts.length;

							for (var i=0; i < count; i++){
								var ptn = mapzen.whosonfirst.placetypes.placetypename(label, _alts[i]);
								names.push(ptn);
							}
						}

						return names;
					},

					'parents': function(){
						return _self.details['parent'];
					},

					'ancestors': function(roles, ancestors){

						if (! roles){
							roles = [ 'common' ];
						}

						if (! ancestors){
							ancestors = [];
						}

						var parents = _self.parents();
						var count_parents = parents.length;

						for (var i=0; i < count_parents; i++){

							var p = parents[i];
							p = mapzen.whosonfirst.placetypes.placetype(p);

							var name = p.name();
							var role = p.role();

							if (ancestors.indexOf(name) != -1){
								continue;
							}

							if (roles.indexOf(role) == -1){
								continue;
							}

							ancestors.push(name)
							p.ancestors(roles, ancestors)
						}

						return ancestors;
					}
				};

				return _self;
			};

			return instance(pt);
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

mapzen.whosonfirst.uri = (function(){

	var _endpoint = "https://data.whosonfirst.org/";

	var self = {

		'endpoint': function(e){

			if (e){
				mapzen.whosonfirst.log.info("set uri endpoint to " + e);
				_endpoint = e;
			}

			return _endpoint;
		},

		'id2abspath': function (id, args){
		    
		    var rel_path = self.id2relpath(id, args);
		    var abs_path = self.endpoint() + rel_path;
		    
		    return abs_path;
		},

		'id2relpath': function(id, args){

			parent = self.id2parent(id);
			fname = self.id2fname(id, args);

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

		'id2fname': function(id, args){

		    if (! args){
			args = {};
		    }

		    var fname = [
			encodeURIComponent(id)
		    ];

		    if (args["alt"]) {

			if (args["source"]){

			    // to do: validate source here
			    // to do: actually write mapzen.whosonfirst.source.js
			    // (20161130/thisisaaronland)

			    var source = encodeURIComponent(args["source"]);
			    fname.push(source);

			    if (args["function"]){

				var func = encodeURIComponent(args["function"]);
				fname.push(func);

				if ((args["extras"]) && (args["extras"].join)){

				    var extras = args["extras"];
				    var count = extras.length;

				    for (var i = 0; i < count; i++){
					var extra = encodeURIComponent(extras[i]);
					fname.push(extra);
				    }
				}
			    }
			}

			else {
			    console.log("missing source parameter for alternate geometry");
			    fname.push("unknown");
			}
			
		    }

		    var str_fname = fname.join("-");

		    return str_fname + ".geojson";
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

					var _swlat = bbox[0];
					var _swlon = bbox[1];
					var _nelat = bbox[2];
					var _nelon = bbox[3];

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

				// Adapted from http://gis.stackexchange.com/a/172561
				var geom = geojson['geometry'];
				var coords = geom.coordinates;

				var lats = [],
				    lngs = [];

				for (var i = 0; i < coords[0].length; i++) {
					lats.push(coords[0][i][1]);
					lngs.push(coords[0][i][0]);
				}

				var minlat = Math.min.apply(null, lats),
				    maxlat = Math.max.apply(null, lats);
				var minlng = Math.min.apply(null, lngs),
				    maxlng = Math.max.apply(null, lngs);

				return [ minlat, minlng,
					 maxlat, maxlng ];
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
			return layer;
		},

		'draw_poly': function(map, geojson, style){

			var layer = L.geoJson(geojson, {
				'style': style
			});

			// https://github.com/Leaflet/Leaflet.label

			try {
			    var props = geojson['properties'];

			    if (props){
				var label = props['lflt:label_text'];

				if (label){
				    layer.bindLabel(label, {noHide: true });
				}
			    }

			    else {
				console.log("polygon is missing a properties dictionary");
			    }
			}

			catch (e){
				console.log("failed to bind label because " + e);
			}

			layer.addTo(map);
			return layer;
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
			    var opts = { 'padding': [ 50, 50 ] };
			    map.fitBounds(bounds, opts);
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
				"color": "#000",
				"weight": 2,
				"opacity": 1,
				"radius": 6,
				"fillColor": "#0BBDFF",
				"fillOpacity": 1
			};
		},

		'breach_polygon': function(){

			return {
				"color": "#ffff00",
				//"color": "#002EA7",
				"weight": 1.5,
				"dashArray": "5, 5",
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
				"color": "#000",
				"weight": 1,
				"opacity": 1,
				"fillColor": "#00308F",
				"fillOpacity": 0.5
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

    	// See the way this is a relative path? Yeah, we assign abs_root_url
    	// below in the 'scenefile' method (20160201/thisisaaronland)
    
    var _scenefile = 'static/tangram/refill.yaml'
    var _key = 'nextzen-xxxxxx';	// https://developers.nextzen.org/

    var _tileurl = 'https://tile.nextzen.org/tilezen/vector/v1/512/all/{z}/{x}/{y}.topojson';
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

			        // if (L.Hash){
			    	//     var hash = new L.Hash(map);
				// }

			        var scale = L.control.scale();
				scale.addTo(map);

				var tangram = self.tangram();
				tangram.addTo(map);

				_cache[id] = map;
			}

			return _cache[id];
		},

		'tangram': function(scene){

			var scenefile = self.scenefile();
			var attributions = self.attributions();
			var attribution = self.render_attributions(attributions);

			var tangram = Tangram.leafletLayer({
			    scene: {
				import: scenefile,
				global: {
				    sdk_mapzen_api_key: _key,
				},
				sources: {
				    mapzen: { url: _tileurl }
				}
			    },
			    numWorkers: 2,
			    unloadInvisibleTiles: false,
			    updateWhenIdle: false,
			    attribution: attribution,
			});
		    
		    return tangram;
		},

		'scenefile': function(url){

			if (url){
				_scenefile = url;
			}

  	  		var root = document.body.getAttribute("data-abs-root-url");
			return root + _scenefile;
		},

		'attributions': function(){

			var attributions = {
				'Tangram': 'https://github.com/tangrams/',
				'© OSM contributors': 'http://www.openstreetmap.org/',
				'Who\'s On First': 'http://www.whosonfirst.org/',
				'Nextzen': 'https://nextzen.org/',
			};

			return attributions;
		},

		'render_attributions': function(attrs){

			var parts = [];

			for (var label in attrs){

				var link = attrs[label];

				var enc_label = mapzen.whosonfirst.php.htmlspecialchars(label);

				if (! link){
					parts.push(enc_label);
					continue;
				}

				var anchor = '<a href="' + link + '" target="_blank">' + enc_label + '</a>';
				parts.push(anchor);
			}

			return parts.join(" | ");
		},

		'scene': function(id){

			var m = self.map(id);
			var s = undefined;

			m.eachLayer(function(l){

					if (s){
						return;
					}
					
					if (! l.scene){
						return;
					}
					
					if (l.scene.gl) {
						s = l.scene;
					}
			});

			return s;
		},

		// requires https://github.com/eligrey/FileSaver.js

		'screenshot_as_file': function(id){

			if (typeof(saveAs) == "undefined"){
				mapzen.whosonfirst.log.error("missing 'saveAs' controls");
				return false
			}

			var fname = 'whosonfirst-spelunker-' + (+new Date()) + '.png';

			var callback = function(sh){					
				saveAs(sh.blob, fname);
			};
			
			return self.screenshot(id, callback);
		},

		// requires https://github.com/tangrams/tangram/releases/tag/v0.5.0

		'screenshot': function(id, on_screenshot){
		    
		    if (! on_screenshot){
			
			on_screenshot = function(sh) {
			    window.open(sh.url);
			    return false;
			};
		    }

		    var scene = self.scene(id);

		    if (! scene){
			mapzen.whosonfirst.log.error("failed to retrieve scene, trying to render screenshot");
			return false;
		    }

		    var el = document.getElementById("wof-record");

		    if (! el){
			mapzen.whosonfirst.log.error("unable to locate 'wof-record' element, trying to render screenshot");
			return false;
		    }
		    
		    var wofid = el.getAttribute("data-wof-id");

		    if (! el){
			mapzen.whosonfirst.log.error("unable to locate 'data-wof-id' attribute, trying to render screenshot");
			return false;
		    }

		    var url = mapzen.whosonfirst.uri.id2abspath(wofid);

		    // akin to a Leaflet "layer" - draw with the polygon overlay style (defined below)

		    scene.config.layers.wof = {
		      	"data": { "source":"wof" },
			"draw": { "polygons-overlay": { "color": "rgba(255, 255, 0, 0.6)"}, "lines": { "color": "rgb(255, 0, 153)", "width": "4px", "order":1000 } }
		    };
		    
		    // the polygon overlay 

		    scene.config.styles['polygons-overlay'] = { "base": "polygons",  "blend": "overlay" };
		    
		    // The data being styled - see the way we're calling mapzen.whosonfirst.net.fetch below?
		    // That's because we should already have a cache of the data locally so it will return
		    // right away. With that data we hand off to the scene object and carry on with the
		    // screenshot. (20160322/thisisaaronland)
		    
		    var on_fetch = function(feature){

			var wof = {
			    type: 'GeoJSON',
			    data: feature,
			    // url: url
			};

			// Draw the stuff which really means draws the stuff after
			// we invoke 'updateConfig' - this will not require updating
			// the config soon but today, it does (20160322/thisisaaronland)

			scene.setDataSource('wof', wof);

			var on_rebuild = function(){

			    var on_render = function(rsp){

				// remove the stuff (leaving the Leaflet GeoJSON stuff)

				scene.setDataSource('wof', { type: 'GeoJSON', data: {} });
				on_screenshot(rsp);
			    };

			    scene.screenshot().then(on_render);
			};

			// This is deliberate while we are waiting on updates to Tangram.js
			// It's not pretty but it works (20160323/thisisaaronland)

			scene.updateConfig({ rebuild: true }).then(function() {  });
			scene.updateConfig({ rebuild: true }).then(on_rebuild);

		    };

		    var on_fail = function(){
			mapzen.whosonfirst.log.error("failed to render screenshot");
		    };

		    mapzen.whosonfirst.net.fetch(url, on_fetch, on_fail);
		    return false;
		},

		'set_key': function(api_key) {
		    _key = api_key;
		},
	    
	    'set_tile_url': function(url){
		_tileurl = url;
	    },

	};

	return self;
})();
var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.net = (function(){

	var default_cache_ttl = 30000; // ms

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

		'fetch': function(url, on_success, on_fail, args){

		    	if (typeof(args) == "undefined") {
			    args = {};
			}

		    	// this is here for backwards compatibility
		    	// (20170113/thisisaaronland)

		    	else if (typeof(args) == "number") {
			    args = { "cache_ttl": args };
			}

		    	else {}

			if (args["cache_ttl"]){
			    args["cache_ttl"] = default_cache_ttl;
			}

		        else {
			     cache_ttl = default_cache_ttl;
			}

			var on_hit = function(data){
				mapzen.whosonfirst.log.debug("[cached] fetch " + url);
				if (on_success){
					on_success(data);
				}
			};

			var on_miss = function(){
				mapzen.whosonfirst.log.debug("[xhr] fetch " + url);
				self.fetch_with_xhr(url, on_success, on_fail, args);
			};

			if (! self.cache_get(url, on_hit, on_miss, cache_ttl)){
				self.fetch_with_xhr(url, on_success, on_fail, args);
			}
		},

		'fetch_with_xhr': function(url, on_success, on_fail, args){

			if (! args){
			    args = {};
			}

			var req = new XMLHttpRequest();

			req.onload = function(){

				try {
					var data = JSON.parse(this.responseText);
				}

				catch (e){
					mapzen.whosonfirst.log.error("failed to parse " + url + ", because " + e);

					if (on_fail){
						on_fail({
							url: url,
							args: args,
							xhr: req
						});
					}

					return false;
				}

				self.cache_set(url, data);

				if (on_success){
					on_success(data);
				}
			};

			try {

			    	if (args["cache-busting"]){

				    var cb = Math.floor(Math.random() * 1000000);

				    var tmp = document.createElement("a");
				    tmp.href = url;

				    if (tmp.search){
					tmp.search += "&cb=" + cb;
				    }

				    else {
					tmp.search = "?cb= " + cb;
				    }

				    url = tmp.href;
				}

			    	// console.log("ARGS " + args);
			    	// console.log("URL " + url);

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

		'cache_get': function(key, on_hit, on_miss, cache_ttl){

			if (typeof(localforage) != 'object'){
				return false;
			}

			var fq_key = self.cache_prep_key(key);

			localforage.getItem(fq_key, function (err, rsp){

				if ((err) || (! rsp)){
					on_miss();
					return;
				}

				var data = rsp['data'];

				if (! data){
					on_miss();
					return;
				}

				var dt = new Date();
				var ts = dt.getTime();

				var then = rsp['created'];
				var diff = ts - then;

				if (diff > cache_ttl){
					self.cache_unset(key);
					on_miss();
					return;
				}

				on_hit(data);
			});

			return true;
		},

		'cache_set': function(key, value){

			if (typeof(localforage) != 'object'){
				return false;
			}

			var dt = new Date();
			var ts = dt.getTime();

			var wrapper = {
				'data': value,
				'created': ts
			};

			key = self.cache_prep_key(key);

			localforage.setItem(key, wrapper);
			return true;
		},

		'cache_unset': function(key){

			if (typeof(localforage) != 'object'){
				return false;
			}

			key = self.cache_prep_key(key);

			localforage.removeItem(key);
			return true;
		},

		'cache_prep_key': function(key){
			return key + '#mapzen.whosonfirst.net';
		}
	};

	return self;

})();
var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.enmapify = (function(){

	var self = {
		'render_id': function(map, wofid, on_fetch){
			
			var _self = self;
			
			if (! wofid){
				mapzen.whosonfirst.log.error("failed to enmapify because missing WOF ID");
				return false;
			}
			
			if (! on_fetch){

				on_fetch = function(geojson){
					self.render_feature(map, geojson);
				};
			}

			var url = mapzen.whosonfirst.uri.id2abspath(wofid);

			mapzen.whosonfirst.net.fetch(url, on_fetch);
		},
		
		'render_feature_outline': function(map, feature){

			mapzen.whosonfirst.leaflet.fit_map(map, feature);
			mapzen.whosonfirst.leaflet.draw_poly(map, feature, mapzen.whosonfirst.leaflet.styles.parent_polygon());
		},

		'render_feature': function(map, feature){

			mapzen.whosonfirst.leaflet.fit_map(map, feature);
			
			var props = feature['properties'];
			
			var child_id = props['wof:id'];
			var parent_id = props['wof:parent_id'];
			
			var child_url = mapzen.whosonfirst.uri.id2abspath(child_id);
			var parent_url = mapzen.whosonfirst.uri.id2abspath(parent_id);
			
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

					var name = props['wof:name'];

					var label_text = name;
					label_text += ', whose geom centroid is ';
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
						
						var label_src = props['src:lbl_centroid'] || props['src:centroid_lbl'] || "UNKNOWN";
						
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
						var breach_url = mapzen.whosonfirst.uri.id2abspath(breach_id);
						
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
			
			if ((! parent_id) || (parent_id < 0)){
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

mapzen.whosonfirst.properties = (function(){

    var self = {

	'render': function(props){

	    var possible_wof = [
		'wof.belongsto',
		'wof.parent_id', 'wof.children',
		'wof.breaches',
		'wof.supersedes',
		'wof.superseded_by',
		// TO DO : please to write js.whosonfirst.placetypes...
		'wof.hierarchy.continent_id', 'wof.hierarchy.country_id', 'wof.hierarchy.macroregion_id', 'wof.hierarchy.region_id',
		'wof.hierarchy.county_id', 'wof.hierarchy.localadmin_id', 'wof.hierarchy.borough_id', 'wof.hierarchy.locality_id',
		'wof.hierarchy.macrohood_id', 'wof.hierarchy.neighbourhood_id', 'wof.hierarchy.microhood_id',
		'wof.hierarchy.campus_id', 'wof.hierarchy.venue_id'
	    ];

	    var text_callbacks = {
		'wof.id': mapzen.whosonfirst.yesnofix.render_code,
		//'wof.id': mapzen.whosonfirst.render_wof_id,
		'wof.placetype': self.render_placetype,
		'wof.concordances.4sq:id': self.render_foursquare_id,
		'wof.concordances.companieshouse:number': self.render_companieshouse_number,
		'wof.concordances.gn:id': self.render_geonames_id,
		'wof.concordances.gp:id': self.render_woedb_id,
		'wof.concordances.woe:id': self.render_woedb_id,
		'wof.concordances.oa:id': self.render_ourairport_id,
		'wof.concordances.osm:node': self.render_openstreetmap_node,
		'wof.concordances.osm:way': self.render_openstreetmap_way,
		'wof.concordances.osm:rel': self.render_openstreetmap_relation,
		'wof.concordances.osm:relation': self.render_openstreetmap_relation,
		'wof.concordances.faa:code': self.render_faa_code,
		'wof.concordances.latimes:id': self.render_latimes_id,
		'wof.concordances.tgn:id': self.render_tgn_id,
		'wof.concordances.transitland:onestop_id': self.render_transitland_onestop_id,
		'wof.concordances.wd:id': self.render_wikidata_id,
		'wof.concordances.wk:page': self.render_wikipedia_page,
		'wof.lastmodified': mapzen.whosonfirst.yesnofix.render_timestamp,
		'wof.megacity': self.render_megacity,
		'wof.repo': self.render_wof_repo,
		'wof.tags': self.render_wof_tags,
		'wof.name': self.render_wof_name,
		'sg.city': self.render_simplegeo_city,
		'sg.postcode': self.render_simplegeo_postcode,
		'sg.tags': self.render_simplegeo_tags,
		'sg.classifier': self.render_simplegeo_classifiers,
	    };
	
	    var text_renderers = function(d, ctx){

		if ((possible_wof.indexOf(ctx) != -1) && (d > 0)){
		    return self.render_wof_id;
		}

		else if (ctx.match(/^name-/)){
		    return self.render_wof_name;
		}

		else if (ctx.match(/^sg-classifiers-/)){
		    return self.render_simplegeo_classifiers;
		}

		else if (text_callbacks[ctx]){
		    return text_callbacks[ctx];
		}

		else {
		    return null;
		}
	    };

	    var dict_mappings = {
		'wof.concordances.4sq:id': 'foursquare',
		'wof.concordances.dbp:id': 'dbpedia',
		'wof.concordances.faa:code': 'faa',
		'wof.concordances.fb:id': 'freebase',
		'wof.concordances.fct:id': 'factual',
		'wof.concordances.gn:id': 'geonames',
		'wof.concordances.gp:id': 'geoplanet',
		'wof.concordances.icao:code': 'icao',
		'wof.concordances.iata:code': 'iata',
		'wof.concordances.latimes:id': 'los angeles times',
		'wof.concordances.loc:id': 'library of congress',
		'wof.concordances.nyt:id': 'new york times',
		'wof.concordances.oa:id': 'ourairports',
		'wof.concordances.osm:node': 'openstreetmap',
		'wof.concordances.osm:way': 'openstreetmap',
		'wof.concordances.osm:rel': 'openstreetmap',
		'wof.concordances.osm:relation': 'openstreetmap',
		'wof.concordances.qs:id': 'quattroshapes',
		'wof.concordances.transitland:onestop_id': 'transitland',
		'wof.concordances.wk:page': 'wikipedia',
		'wof.concordances.wd:id': 'wikidata',
		// please build me on the fly using mz.wof.placetypes
		'wof.hierarchy.borough_id': 'borough',
		'wof.hierarchy.continent_id': 'continent',
		'wof.hierarchy.country_id': 'country',
		'wof.hierarchy.macroregion_id': 'macro region',
		'wof.hierarchy.region_id': 'region',
		'wof.hierarchy.campus_id': 'campus',
		'wof.hierarchy.county_id': 'county',
		'wof.hierarchy.intersection': 'intersection',
		'wof.hierarchy.localadmin_id': 'local admin',
		'wof.hierarchy.locality_id': 'locality',
		'wof.hierarchy.macrohood_id': 'macro hood',
		'wof.hierarchy.neighbourhood_id': 'neighbourhood',
		'wof.hierarchy.microhood_id': 'micro hood',
	    };

	    var dict_renderers = function(d, ctx){

		// TO DO: something to match 3-letter language code + "_x_" + suffix
		// or more specifically something to match/ convert 3-letter language
		// codes wrapped up in a handy library (20160211/thisisaaronland)

		if (dict_mappings[ctx]){
		    return function(){
			return dict_mappings[ctx];
		    };
		}

		return null;
	    };

	    var text_exclusions = function(d, ctx){

		return function(){

		    if (ctx.match(/^geom/)){
			return true;
		    }

		    else if ((ctx.match(/^edtf/)) && (d == "uuuu")){
			return true;
		    }

		    else if (ctx == 'wof.lastmodified'){
			return true;
		    }

		    else if (ctx == 'wof.geomhash'){
			return true;
		    }

		    else if (ctx == 'wof.id'){
			return true;
		    }

		    else {
			return false;
		    }
		};

	    };

	    mapzen.whosonfirst.yesnofix.set_submit_handler(self.submit_handler);

	    mapzen.whosonfirst.yesnofix.set_custom_renderers('text', text_renderers);
	    mapzen.whosonfirst.yesnofix.set_custom_renderers('dict', dict_renderers);

	    mapzen.whosonfirst.yesnofix.set_custom_exclusions('text', text_exclusions);
	    
	    var pretty = mapzen.whosonfirst.yesnofix.render(props);
	    return pretty;
	},

	// TO DO : make 'mapzen.whosonfirst.spelunker.abs_root_url' something like
	// 'mapzen.whosonfirst.common.abs_root_url' or equivalent...

	'render_wof_id': function(d, ctx){
	    var root = mapzen.whosonfirst.spelunker.abs_root_url();
	    var link = root + "id/" + encodeURIComponent(d) + "/";
	    var el = mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	    
	    var text = el.children[0];
	    text.setAttribute("data-value", mapzen.whosonfirst.php.htmlspecialchars(d));
	    text.setAttribute("class", "props-uoc props-uoc-name props-uoc-name_" + mapzen.whosonfirst.php.htmlspecialchars(d));
	    
	    return el;
	    
	},

	'render_wof_repo': function(d, ctx){

	    var root = 'https://github.com/whosonfirst-data/';

	    // until we switch the org

	    if (d == 'whosonfirst-data'){
		var root = 'https://github.com/whosonfirst/';
	    }
	    
	    var link = root + encodeURIComponent(d) + "/";
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_wof_placetype': function(d, ctx){
	    var root = mapzen.whosonfirst.spelunker.abs_root_url();
	    var link = root + "placetypes/" + encodeURIComponent(d) + "/";
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_foursquare_id': function(d, ctx){
	    var link = "https://www.foursquare.com/v/" + encodeURIComponent(d) + "/";
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_geonames_id': function(d, ctx){
	    var link = "http://geonames.org/" + encodeURIComponent(d) + "/";
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_woedb_id': function(d, ctx){
	    var link = "https://woe.spum.org/id/" + encodeURIComponent(d) + "/";
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_wikipedia_page': function(d, ctx){

	    // decodeURI("Montr%C3%A9al-Pierre_Elliott_Trudeau_International_Airport")
	    // "Montréal-Pierre_Elliott_Trudeau_International_Airport"
	    // encodeURIComponent(decodeURI("Montr%C3%A9al-Pierre_Elliott_Trudeau_International_Airport"))
	    // "Montr%C3%A9al-Pierre_Elliott_Trudeau_International_Airport"

	    d = decodeURI(d);
	    var link = "https://www.wikipedia.org/wiki/" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_wikidata_id': function(d, ctx){
	    var link = "https://www.wikidata.org/wiki/" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_transitland_onestop_id': function(d, ctx){

	    var href = "https://mobility-explorer.netlify.com/#/stops?bbox=__BBOX__&onestop_id=" + encodeURIComponent(d);
	    var link = mapzen.whosonfirst.yesnofix.render_link(href, d, ctx);

	    link.onclick = function(e){

		try {
		    var el = e.target;
		    var parent = el.parentNode;

		    var href = parent.getAttribute("href");
		    
		    var lat = document.getElementById("geom.latitude");
		    var lon = document.getElementById("geom.longitude");
		    
		    lat = parseFloat(lat.innerText);
		    lon = parseFloat(lon.innerText);

		    // this is cloned in to the spelunker repo but
		    // https://github.com/davidwood/node-geopoint

		    var gp = new GeoPoint(lat, lon, false);
		    var bounds = gp.boundingCoordinates(.5);

		    var bbox = [
			bounds[0].longitude(), bounds[0].latitude(),
			bounds[1].longitude(), bounds[1].latitude()
		    ];

		    bbox = bbox.join(",");
		    bbox = encodeURIComponent(bbox);
		    
		    href = href.replace("__BBOX__", bbox);
		    location.href = href;
		}

		catch (e) {
		    console.log("Failed to generate Transitland / Mobility Explore URL, because " + e);
		}

		return false;
	    };

	    return link;
	},

	'render_tgn_id': function(d, ctx){
	    var link = "http://vocab.getty.edu/tgn/" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_ourairport_id': function(d, ctx){
	    var link = "http://ourairports.com/airports/" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_openstreetmap_node': function(d, ctx){
	    var link = "https://openstreetmap.org/node/" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_openstreetmap_way': function(d, ctx){
	    var link = "https://openstreetmap.org/way/" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_openstreetmap_relation': function(d, ctx){
	    var link = "https://openstreetmap.org/relation/" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_faa_code': function(d, ctx){
	    var link = "http://www.fly.faa.gov/flyfaa/flyfaaindex.jsp?ARPT=" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_companieshouse_number': function(d, ctx){
	    var link = "http://data.companieshouse.gov.uk/doc/company/" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_latimes_id': function(d, ctx){

	    var link = "http://maps.latimes.com/neighborhoods/neighborhood/" + encodeURIComponent(d);
	    var el = mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);

	    el.onclick = function(e){ 

		try {
		    var el = e.target;
		    var parent = el.parentNode;
		    var href = parent.getAttribute("href");
		    
		    var pt = document.getElementById("wof.placetype");
		    pt = pt.innerText;
		    
		    if (pt == "macrohood"){
			href = href.replace("neighborhoods/neighborhood", "neighborhoods/region");
		    }
		    
		    location.href = href;
		    return false;
		}

		catch (e){
		    console.log("failed to generate latimes:id link, because " + e);
		}
	    };

	    return el;
	},

	'render_megacity': function(d, ctx){
	    var root = mapzen.whosonfirst.spelunker.abs_root_url();
	    var link = root + "megacities/";
	    return mapzen.whosonfirst.yesnofix.render_link(link, "HOW BIG WOW MEGA SO CITY", ctx);
	},

	'render_wof_tags': function(d, ctx){
	    var root = mapzen.whosonfirst.spelunker.abs_root_url();
	    var link = root + "tags/" + encodeURIComponent(d) + "/";
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_wof_name': function(d, ctx){
	    var root = mapzen.whosonfirst.spelunker.abs_root_url();
	    var link = root + "search/?q=" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_simplegeo_city': function(d, ctx){
	    var root = mapzen.whosonfirst.spelunker.abs_root_url();
	    var link = root + "search/?q=" + encodeURIComponent(d) + "&placetype=locality";
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);	    
	},
	
	'render_simplegeo_postcode': function(d, ctx){
	    var root = mapzen.whosonfirst.spelunker.abs_root_url();
	    var link = root + "postalcodes/" + encodeURIComponent(d) + "/";
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);	    
	},

	'render_simplegeo_classifiers': function(d, ctx){
	    var root = mapzen.whosonfirst.spelunker.abs_root_url();
	    var link = root + "categories/" + encodeURIComponent(d) + "/";
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_simplegeo_tags': function(d, ctx){
            var root = mapzen.whosonfirst.spelunker.abs_root_url();
            var link = root + "tags/" + encodeURIComponent(d) + "/";
            return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	// pending a final working soundbox installation
	// (20160405/thisisaaronland)
	
	'submit_handler': function(report){

	    var close_modal = function(){
		var about = document.getElementById("yesnofix-about");
		var parent = about.parentElement;
		parent.removeChild(about);
	    };

	    var on_submit = function(){

		close_modal();

		report = encodeURIComponent(report);
		var data = "data:text/plain;charset=UTF-8," + report;
		window.open(data, '_report');
	    };

	    var on_cancel = function(){
		close_modal();
	    };

	    // See this - we are purposefully re-using the CSS from the
	    // default about widget (20160405/thisisaaronland)

	    var about = document.createElement("div");
	    about.setAttribute("id", "yesnofix-about");

	    var text = document.createElement("div");
	    text.setAttribute("id", "yesnofix-about-text");

	    var head = document.createElement("h2");
	    head.appendChild(document.createTextNode("You have found an experimental feature!"));

	    var intro = document.createElement("div");

	    var p1_sentences = [
		"Thank you for taking the time to fact-check this data.",
		"There are two pieces to any data collection project: the reporting and the collecting.",
		"If you're reading this it means that only the reporting piece is live for Who's On First.",
		"We expect the collection piece to be live shortly but in the meantime you can generate a text version of your report.",
		"Soon you will be able to send it to Who's On First directly",
		"If you'd like to know more about this project all the details are available in this blog post:",
	    ];
	    
	    var p1_text = p1_sentences.join(" ");

	    var p1 = document.createElement("p");
	    p1.appendChild(document.createTextNode(p1_text));

	    var href = "https://www.whosonfirst.org/blog/2016/04/08/yesnofix/";

	    var link = document.createElement("a");
	    link.setAttribute("href", href);
	    link.setAttribute("target", "blog");
	    link.appendChild(document.createTextNode(href));

	    var p2 = document.createElement("p");
	    p2.appendChild(link);

	    intro.appendChild(p1);
	    intro.appendChild(p2);

	    text.appendChild(head);
	    text.appendChild(intro);

	    var close = document.createElement("div");
	    close.setAttribute("id", "yesnofix-about-submit");

	    var cancel_button = document.createElement("button");
	    cancel_button.setAttribute("id", "yesnofix-about-cancel-button");
	    cancel_button.appendChild(document.createTextNode("cancel"));

	    var submit_button = document.createElement("button");
	    submit_button.setAttribute("id", "yesnofix-about-submit-button");
	    submit_button.appendChild(document.createTextNode("submit"));

	    close.appendChild(cancel_button);
	    close.appendChild(submit_button);

	    about.appendChild(text);
	    about.appendChild(close);

	    cancel_button.onclick = on_cancel;
	    submit_button.onclick = on_submit;

	    var body = document.body;
	    body.insertBefore(about, body.firstChild);

	    return false;
	},

    };

    return self;

})();
var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.yesnofix = (function(){

    var status_map = {
	'fix': -1,
	'no': 0,
	'yes': 1
    };

    var _custom_renderers = {
	'dict': function(d, ctx){ return null; },
	'text': function(d, ctx){ return null; },
    };

    var _exclusions = {
	'text': function(d, ctx){ return null; },
    };

    var _enabled = true;

    var assertions = {};
    var current = null;

    var submit_handler = function(report){
	report = encodeURIComponent(report);
	var data = "data:text/plain;charset=UTF-8," + report;
	window.open(data, '_report');
    };

    var self = {

	'enabled': function(bool){

	    if (typeof(bool) != "undefined"){
		if (bool){
		    _enabled = true;
		} else {
		    _enabled = false;
		}
	    }

	    return _enabled;
	},
	
	'set_submit_handler': function(handler){

	    if (typeof(handler) != "function"){
		self.notify("invalid handler", "error");
		return false;
	    }

	    submit_handler = handler;
	    return true;
	},

	'set_custom_renderers': function(t, r){

	    if (! _custom_renderers[t]){
		return;
	    }

	    if (! r){
		return;
	    }

	    _custom_renderers[t] = r;
	},

	'get_custom_renderer': function(t, d, ctx){

	    if (! _custom_renderers[t]){
		return null;
	    }

	    var custom = _custom_renderers[t];
	    return custom(d, ctx);
	},

	'set_custom_exclusions': function(t, e){

	    if (! _exclusions[t]){
		return;
	    }

	    if ((! e) || (typeof(e) != "function")){
		return;
	    }

	    _exclusions[t] = e;
	},

	'get_custom_exclusion': function(t, d, ctx){

	    if (! _exclusions[t]){
		return null;
	    }

	    var exclude =  _exclusions[t];
	    return exclude(d, ctx);
	},
	
	'apply': function(data, target){
	    
	    var el = document.getElementById(target);
	    
		if (! el){
		return false;
	    }
	    
	    var pretty = self.render(data);
	    el.appendChild(pretty);

	    return true;
	},
	
	'render': function(props){
	    
	    var pretty = document.createElement("div");
	    pretty.setAttribute("id", "yesnofix-pretty");

	    var controls = self.render_controls();
	    pretty.appendChild(controls);

	    buckets = self.bucket_props(props);
	    
	    var namespaces = Object.keys(buckets);
	    namespaces = namespaces.sort();

	    var count_ns = namespaces.length;
	    
	    for (var i=0; i < count_ns; i++){
		var ns = namespaces[i];
		var dom = self.render_bucket(ns, buckets[ns]);
		pretty.appendChild(dom);
	    }

	    return pretty;				
	},
	
	'render_controls': function(){

	    var report = document.createElement("div");
	    report.setAttribute("id", "yesnofix-report");

	    var buttons = document.createElement("div");
	    buttons.setAttribute("id", "yesnofix-report-buttons");

	    var show = document.createElement("button");
	    show.setAttribute("id", "yesnofix-report-show");
	    show.appendChild(document.createTextNode("show report"));

	    var hide = document.createElement("button");
	    hide.setAttribute("id", "yesnofix-report-hide");
	    hide.appendChild(document.createTextNode("hide report"));

	    var submit = document.createElement("button");
	    submit.setAttribute("id", "yesnofix-report-submit");
	    submit.appendChild(document.createTextNode("submit report"));

	    var br = document.createElement("br");
	    br.setAttribute("clear", "all");

	    buttons.appendChild(show);
	    buttons.appendChild(hide);
	    buttons.appendChild(submit);
	    buttons.appendChild(br);

	    var body = document.createElement("pre");
	    body.setAttribute("id", "yesnofix-report-body");

	    show.onclick = function(){

		var sh = document.getElementById("yesnofix-report-show");
		var hd = document.getElementById("yesnofix-report-hide");
		var sb = document.getElementById("yesnofix-report-submit");
		var bd = document.getElementById("yesnofix-report-body");

		sh.style = "display:none;";
		hd.style = "display:block;";
		bd.style = "display:block;";
		sb.style = "display:block;";
	    };

	    hide.onclick = function(){

		var sh = document.getElementById("yesnofix-report-show");
		var hd = document.getElementById("yesnofix-report-hide");
		var sb = document.getElementById("yesnofix-report-submit");
		var bd = document.getElementById("yesnofix-report-body");

		sh.style = "display:block;";
		hd.style = "display:none;";
		bd.style = "display:none;";
		sb.style = "display:none;";
	    };

	    submit.onclick = function(){
		submit_handler(self.report());
	    };

	    report.appendChild(buttons);
	    report.appendChild(body);

	    return report;
	},

	'render_bucket': function(ns, bucket){
	    
	    var wrapper = document.createElement("div");

		if (ns != '_global_'){

			var header = document.createElement("h3");
			var content = document.createTextNode(ns);
			header.appendChild(content);

			wrapper.appendChild(header);			
		}

	    var sorted = self.sort_bucket(bucket);
	    var body = self.render_data(sorted, ns);
	    
	    wrapper.appendChild(body);
	    
	    return wrapper;
	},
	
	'render_data': function(d, ctx){
	    
	    if (Array.isArray(d)){
		// console.log("render list for " + ctx);
		return self.render_list(d, ctx);
	    }
	    
	    else if (typeof(d) == "object"){
		// console.log("render dict for " + ctx);
		return self.render_dict(d, ctx);
	    }
	    
	    else {
		// console.log("render text for " + ctx);

		var wrapper = document.createElement("span");
		wrapper.setAttribute("class", "yesnofix-content");

		var add_trigger = true;

		if (! _enabled){
		    add_trigger = false;
		}

		if (add_trigger){

		    var exclusion = self.get_custom_exclusion('text', d, ctx);

		    if ((exclusion) && (exclusion(d, ctx))){

			var lock = self.render_locked(ctx);
			wrapper.appendChild(lock);   
		    }

		    else {

			var trigger = self.render_trigger(ctx);
			wrapper.appendChild(trigger);
		    }
		}
		
		var content;

		var renderer = self.get_custom_renderer('text', d, ctx);
		// console.log("rendered for " + ctx + " : " + typeof(renderer));

		if (renderer){
		    try {
			content = renderer(d, ctx);
		    } catch (e) {
			console.log("UNABLE TO RENDER " + ctx + " BECAUSE " + e);
		    }
		}

		else {
		    content = self.render_text(d, ctx);
		}

		wrapper.appendChild(content);

		return wrapper;
	    }
	},
	
	'render_dict': function(d, ctx){
	    
	    var table = document.createElement("table");
	    table.setAttribute("class", "table");
	    
	    for (k in d){
		
		var row = document.createElement("tr");
		var label_text = k;

		var _ctx = (ctx) ? ctx + "." + k : k;

		var renderer = self.get_custom_renderer('dict', d, _ctx);

		if (renderer){
		    try {
			label_text = renderer(d, _ctx);
		    } catch (e) {
			console.log("UNABLE TO RENDER " + _ctx + " BECAUSE " + e);
		    }
		}

		/*
		  unclear if the rule should just be only text (as it currently is)
		  or whether custom markup is allowed... smells like feature quicksand
		  so moving along for now (20160211/thisisaaronland)
		 */

		var header = document.createElement("th");
		var label = document.createTextNode(self.htmlspecialchars(label_text));
		header.appendChild(label);
		
		var content = document.createElement("td");

		var body = self.render_data(d[k], _ctx);		
		content.appendChild(body);

		row.appendChild(header);
		row.appendChild(content);
		
		table.appendChild(row);
	    }
	    
	    return table;
	},
	
	'render_list': function(d, ctx){
	    
	    var count = d.length;
	    
	    if (count == 0){
		return self.render_text("–", ctx);
	    }
	    
	    if (count <= 1){
		return self.render_data(d[0], ctx);
	    }
	    
	    var list = document.createElement("ul");
	    
	    for (var i=0; i < count; i++){
		
		var item = document.createElement("li");
		var body = self.render_data(d[i], ctx + "#" + i);
		
		item.appendChild(body);
		list.appendChild(item);
	    }
	    
	    return list;
	},
	
	'render_text': function(d, ctx){
	    
	    var text = self.htmlspecialchars(d);
	    
	    var span = document.createElement("span");
	    span.setAttribute("id", ctx);
	    span.setAttribute("title", ctx);
	    span.setAttribute("class", "yesnofix-uoc");
	    	    
	    var el = document.createTextNode(text);
	    span.appendChild(el);

	    return span;
	},
	
	'render_link': function(link, text, ctx){

	    var anchor = document.createElement("a");
	    anchor.setAttribute("href", link);
	    anchor.setAttribute("target", "_wof");
	    var body = self.render_text(text, ctx);
	    anchor.appendChild(body);

	    return anchor;
	},

	/*
	  .yesnofix-trigger { display:none; padding-right: 1em; }
	  .yesnofix-content:hover .yesnofix-trigger { display:inline; }
	*/

	'render_trigger': function(ctx){

	    var edit = document.createTextNode("📝");	// http://emojipedia.org/memo/

	    var trigger = document.createElement("span");
	    trigger.setAttribute("trigger-id", ctx);
	    trigger.setAttribute("class", "yesnofix-trigger");
	    trigger.setAttribute("title", "assert an opinion about this attribute");

	    trigger.appendChild(edit);
	    
	    trigger.onclick = mapzen.whosonfirst.yesnofix.ontrigger;
	    return trigger;
	},

	/*
	  .yesnofix-locked { display:none; padding-right: 1em; }
	  .yesnofix-content:hover .yesnofix-locked { display:inline; }
	*/

	'render_locked': function(ctx){
	    
	    var icon = document.createTextNode("🔒");	// http://emojipedia.org/memo/

	    var locked = document.createElement("span");
	    locked.setAttribute("class", "yesnofix-locked");
	    locked.setAttribute("title", "this attribute is locked");

	    locked.appendChild(icon);
	    
	    return locked;
	},

	'render_code': function(text, ctx){
	    
	    var code = document.createElement("code");
	    var body = self.render_text(text, ctx);
	    code.appendChild(body);
	    return code;
	},
	
	'render_timestamp': function(text, ctx){
	    var dt = new Date(parseInt(text) * 1000);
	    return self.render_text(dt.toISOString(), ctx);
	},
	
	'bucket_props': function(props){
	    
	    buckets = {};
	    
	    for (k in props){
		parts = k.split(":", 2);
		
		ns = parts[0];
		pred = parts[1];
		
		if (parts.length != 2){
		    ns = "_global_";
		    pred = k;
		}
		
		if (! buckets[ns]){
		    buckets[ns] = {};					
		}
		
		buckets[ns][pred] = props[k];
	    }
	    
	    return buckets;
	},
	
	'sort_bucket': function(bucket){
	    
	    var sorted = {};
	    
	    var keys = Object.keys(bucket);
	    keys = keys.sort();
	    
	    var count_keys = keys.length;
	    
	    for (var j=0; j < count_keys; j++){
		var k = keys[j];
		sorted[k] = bucket[k];
	    }
	    
	    return sorted;
	},
	
	'ontrigger': function(e) {
	    
	    var target = e.target;
	    var id = target.getAttribute("trigger-id");
	    var value = target.textContent;

	    if (id == self.current){
		return;
	    }

	    if (self.current){
		self.collapse(self.current);
	    }

	    var enc_id = self.htmlspecialchars(id);
	    var enc_value = self.htmlspecialchars(value);
	    
	    var parent = target.parentElement;
	    
	    if (! parent){
		// PLEASE TO MAKE ERRORS...
		return;
	    }
	    
	    var input = self.render_input(id);
	    parent.appendChild(input);

	    self.current = id;
	},
	
	'render_input': function(id){
	    
	    var input = document.createElement("div");
	    input.setAttribute("class", "yesnofix-assert");
	    input.setAttribute("id", "assert-" + id);
	    
	    var yes = document.createElement("button");
	    yes.setAttribute("class", "yesnofix-assert-yes");
	    yes.setAttribute("data-id", id);
	    yes.setAttribute("data-assertion", status_map['yes']);
	    yes.setAttribute("title", "yes, this value is correct");

	    var no = document.createElement("button");
	    no.setAttribute("class", "yesnofix-assert-no");
	    no.setAttribute("data-id", id);
	    no.setAttribute("data-assertion", status_map['no']);
	    no.setAttribute("title", "no, this value is incorrect");
	    
	    var fix = document.createElement("button");
	    fix.setAttribute("class", "yesnofix-assert-fix");
	    fix.setAttribute("data-id", id);
	    fix.setAttribute("data-assertion", status_map['fix']);
	    fix.setAttribute("title", "this value is somewhere between weird data and kind-of-correct data, but still needs some help");
	    
	    var cancel = document.createElement("button");
	    cancel.setAttribute("class", "yesnofix-assert-cancel");
	    cancel.setAttribute("data-id", id);
	    cancel.setAttribute("title", "actually, never mind");

	    var about = document.createElement("button");
	    about.setAttribute("class", "yesnofix-assert-about");
	    about.setAttribute("title", "wait... what's going? what is this?");

	    yes.appendChild(document.createTextNode("yes"));
	    no.appendChild(document.createTextNode("no"));
	    fix.appendChild(document.createTextNode("fix"));
	    cancel.appendChild(document.createTextNode("cancel"));
	    about.appendChild(document.createTextNode("?"));
	    
	    yes.onclick = mapzen.whosonfirst.yesnofix.onassert;
	    no.onclick = mapzen.whosonfirst.yesnofix.onassert;
	    fix.onclick = mapzen.whosonfirst.yesnofix.onassert;
	    cancel.onclick = mapzen.whosonfirst.yesnofix.oncancel;
	    about.onclick = mapzen.whosonfirst.yesnofix.onabout;

	    input.appendChild(yes);
	    input.appendChild(no);
	    input.appendChild(fix);
	    input.appendChild(cancel);
	    input.appendChild(about);

	    input.appendChild(document.createElement("br"));
	    return input;
	},
	
	'onabout': function(){

	    var about = document.createElement("div");
	    about.setAttribute("id", "yesnofix-about");

	    var text = document.createElement("div");
	    text.setAttribute("id", "yesnofix-about-text");

	    var head = document.createElement("h2");
	    head.appendChild(document.createTextNode("What is Yes No Fix ?"));

	    var intro_sentences = [
		"Yes No Fix allows you to fact-check and offer an opinion about the contents of this web page.",
		"Those opinions can then be bundled up as a report and sent to its authors.",
		"When you say:"
	    ];

	    var intro_text = intro_sentences.join(" ");

	    var intro = document.createElement("p");
	    intro.appendChild(document.createTextNode(intro_text));

	    var options = document.createElement("ul");

	    var yes = document.createElement("li");
	    yes.appendChild(document.createTextNode("Yes, this means this data is correct"));

	    var no = document.createElement("li");
	    no.appendChild(document.createTextNode("No, this means this data is incorrect and should be removed"));

	    var fix = document.createElement("li");
	    fix.appendChild(document.createTextNode("Fix, this means this data is not entirely wrong but needs to be corrected"));

	    options.appendChild(yes);
	    options.appendChild(no);
	    options.appendChild(fix);

	    var outro_sentences = [
		"When you're done yes-no-fix-ing things click the \"show report\" button to review your work and submit your report.",
		"The details of where a report is sent and how it is processed will vary from website to website."
	    ];

	    var outro_text = outro_sentences.join(" ");

	    var outro = document.createElement("p");
	    outro.appendChild(document.createTextNode(outro_text));

	    text.appendChild(head);
	    text.appendChild(intro);
	    text.appendChild(options);
	    text.appendChild(outro);

	    var close = document.createElement("div");
	    close.setAttribute("id", "yesnofix-about-close");

	    var button = document.createElement("button");
	    button.setAttribute("id", "yesnofix-about-close-button");
	    button.appendChild(document.createTextNode("okay!"));

	    close.appendChild(button);

	    about.appendChild(text);
	    about.appendChild(close);

	    button.onclick = function(){
		var about = document.getElementById("yesnofix-about");
		var parent = about.parentElement;
		parent.removeChild(about);
	    };

	    var body = document.body;
	    body.insertBefore(about, body.firstChild);

	    return false;
	},

	'onassert' : function(e){
	    
	    var target = e.target;
	    var id = target.getAttribute("data-id");
	    
	    if (! id){
		return false;
	    }
	    
	    var el = document.getElementById(id);
	    
	    if (! el){
		return false;
	    }
	    
	    var path = id;
	    var value = el.textContent;
	    var assertion = target.getAttribute("data-assertion");

	    var str_assertion = "";

	    for (k in status_map){

		if (assertion == status_map[k]){
		    str_assertion = k;
		    break;
		}
	    }

	    self.assert(path, value, assertion);
	    
	    self.notify(path + "=" + str_assertion);

	    self.collapse(id);

	    var body = document.getElementById("yesnofix-report-body");
	    body.innerHTML = self.report();

	    if (body.style.display != "block"){
		var show = document.getElementById("yesnofix-report-show");
		show.style.display = "block";
	    }

	    var cls = el.getAttribute("class");
	    cls = cls.split(" ");
	    var count = cls.length;

	    var new_cls = [];

	    for (var i=0; i < count; i++){
		if (cls[i].match(/^yesnofix-asserted/)){
		    continue;
		}

		new_cls.push(cls[i]);
	    }

	    new_cls.push("yesnofix-asserted");
	    new_cls.push("yesnofix-asserted-" + str_assertion);
	    new_cls = new_cls.join(" ");

	    console.log(new_cls);
	    el.setAttribute("class", new_cls);

	},
	
	'oncancel': function(e){

	    var target = e.target;
	    var id = target.getAttribute("data-id");
	    
	    if (! id){
		return false;
	    }

	    self.collapse(id);
	},

	// this is a bad name... (20160211/thisisaaronland)

	'collapse': function(id){

	    var input = document.getElementById("assert-" + id);
	    
	    var parent = input.parentElement;
	    parent.removeChild(input);

	    self.current = null;
	},

	// note the lack of validation... we're assuming that kind of sanity
	// checking is happening above?
	
	'assert': function(path, value, assertion){
	    var dt = new Date();
	    assertions[path] = {'path': path, 'value': value, 'assertion': assertion, 'date': dt};
	},
	
	'report': function(){
	    
	    var report = [ "path,value,assertion,date" ];
	    var count = assertions.length;
	    
	    for (path in assertions){
		
		var a = assertions[path];
		
		var row = [ a['path'], a['value'], a['assertion'], a['date'].toISOString() ];
		row = row.join(",");
		
		report.push(row);
	    }
	    
	    report = report.join("\n");
	    return report;
	},

	'notify': function(msg, ctx){

	    // it turns out this stuff is super annoying...
	    // (20160321/thisisaaronland)

	    return;

	    // https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API#Browser_compatibility

	    var enc_msg = self.htmlspecialchars(msg);

	    if (! window.Notification){
		alert(enc_msg);
		return;
	    }

	    if (Notification.permission == "denied"){
		alert(enc_msg);
		return;
	    }

	    if (Notification.permission != "granted"){

		Notification.requestPermission(function(status){
		    return self.notify(msg);
		});
	    }

	    // TO DO: icons based on ctx (20160217/thisisaaronland)

	    var options = { 'body': enc_msg };

	    var n = new Notification('boundary issues', options);
	    setTimeout(n.close.bind(n), 5000); 
	},

	'htmlspecialchars': function(string, quote_style, charset, double_encode){
	    //       discuss at: http://phpjs.org/functions/htmlspecialchars/
	    //      original by: Mirek Slugen
	    //      improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	    //      bugfixed by: Nathan
	    //      bugfixed by: Arno
	    //      bugfixed by: Brett Zamir (http://brett-zamir.me)
	    //      bugfixed by: Brett Zamir (http://brett-zamir.me)
	    //       revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	    //         input by: Ratheous
	    //         input by: Mailfaker (http://www.weedem.fr/)
	    //         input by: felix
	    // reimplemented by: Brett Zamir (http://brett-zamir.me)
	    //             note: charset argument not supported
	    //        example 1: htmlspecialchars("<a href='test'>Test</a>", 'ENT_QUOTES');
	    //        returns 1: '&lt;a href=&#039;test&#039;&gt;Test&lt;/a&gt;'
	    //        example 2: htmlspecialchars("ab\"c'd", ['ENT_NOQUOTES', 'ENT_QUOTES']);
	    //        returns 2: 'ab"c&#039;d'
	    //        example 3: htmlspecialchars('my "&entity;" is still here', null, null, false);
	    //        returns 3: 'my &quot;&entity;&quot; is still here'
	    
	    var optTemp = 0,
	    i = 0,
	    noquotes = false;
	    if (typeof quote_style === 'undefined' || quote_style === null) {
		quote_style = 2;
	    }
	    string = string.toString();
	    if (double_encode !== false) {
		// Put this first to avoid double-encoding
		string = string.replace(/&/g, '&amp;');
	    }
	    string = string.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
	    
	    var OPTS = {
		'ENT_NOQUOTES'          : 0,
		'ENT_HTML_QUOTE_SINGLE' : 1,
		'ENT_HTML_QUOTE_DOUBLE' : 2,
		'ENT_COMPAT'            : 2,
		'ENT_QUOTES'            : 3,
		'ENT_IGNORE'            : 4
	    };
	    if (quote_style === 0) {
		noquotes = true;
	    }
	    if (typeof quote_style !== 'number') {
		// Allow for a single string or an array of string flags
		quote_style = [].concat(quote_style);
		for (i = 0; i < quote_style.length; i++) {
		    // Resolve string input to bitwise e.g. 'ENT_IGNORE' becomes 4
		    if (OPTS[quote_style[i]] === 0) {
			noquotes = true;
		    } else if (OPTS[quote_style[i]]) {
			optTemp = optTemp | OPTS[quote_style[i]];
		    }
		}
		quote_style = optTemp;
	    }
	    if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
		string = string.replace(/'/g, '&#039;');
	    }
	    if (!noquotes) {
		string = string.replace(/"/g, '&quot;');
	    }
	    
	    return string;
	}
	
    }
    
    return self;
    
})();
var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.spelunker = (function(){

	var self = {

		// this is invoked by by mapzen.whosonfirst.spelunker.init.js
		// which is running code (20160202/thisisaaronland)

		'init': function(){
			mapzen.whosonfirst.config.init();

			if (document.getElementById('map')) {
				var m = mapzen.whosonfirst.leaflet.tangram.map('map');
			}
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

				var opts = { 'padding': [ 50, 50 ]};
				map.fitBounds([ sw, ne ], opts);

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
				var url = mapzen.whosonfirst.uri.id2abspath(id);

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
var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.chrome = (function(){

	var self = {

		'init': function() {

			var host = location.host;

			if (host == "spelunker.whosonfirst.org") {
				return;
			}

			var host_id = host.replace(".", "-");
			
			var host_el = document.createElement("div");
			host_el.setAttribute("id", "wof-host-" + host_id);
			host_el.setAttribute("class", "wof-host");

			host_el.appendChild(document.createTextNode(host));

			document.body.insertBefore(host_el, document.body.childNodes[0]);
		}
	};

	return self;
})();
window.addEventListener("load", function load(event){
	mapzen.whosonfirst.chrome.init();
});

// last bundled at 2018-02-15T20:29:58 UTC

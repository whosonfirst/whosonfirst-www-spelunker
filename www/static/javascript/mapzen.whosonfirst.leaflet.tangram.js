var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};
mapzen.whosonfirst.leaflet = mapzen.whosonfirst.leaflet || {};

mapzen.whosonfirst.leaflet.tangram = (function(){

    	// See the way this is a relative path? Yeah, we assign abs_root_url
    	// below in the 'scenefile' method (20160201/thisisaaronland)

	var _scenefile = 'static/tangram/refill.yaml'
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

			var scenefile = self.scenefile();

			var attributions = self.attributions();
			var attribution = self.render_attributions(attributions);

			var tangram = Tangram.leafletLayer({
				scene: scenefile,
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
				'Tangram': 'https://mapzen.com/tangram',
				'© OSM contributors': 'http://www.openstreetmap.org/',
				'Who\'s On First': 'http://whosonfirst.mapzen.com/',
				'Mapzen': 'https://mapzen.com/',
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
				console.log("missing 'saveAs' controls");
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
			console.log("failed to retrieve scene");
			return false;
		    }

		    var el = document.getElementById("wof-record");
		    var wofid = el.getAttribute("data-wof-id");

		    // FIX ME

		    var url = mapzen.whosonfirst.data.id2abspath(wofid);
		    url = "https://s3.amazonaws.com/whosonfirst.mapzen.com" + url;

		    // akin to a Leaflet "layer" - draw with the polygon overlay style (defined below)

		    scene.config.layers.wof = {
		      	"data": { "source":"wof" },
			"draw": { "polygons-overlay": { "color": "rgba(255, 255, 0, 0.6)"}, "lines": { "color": "rgb(255, 0, 153)", "width": "4px", "order":1000 } }
		    };
		    
		    // the polygon overlay 

		    scene.config.styles['polygons-overlay'] = { "base": "polygons",  "blend": "overlay" };
		    
		    // the data being styled
		    
		    var on_fetch = function(feature){

			var wof = {
			    type: 'GeoJSON',
			    data: feature,
			    // url: url
			};

			scene.setDataSource('wof', wof);

			var on_rebuild = function(){

			    var on_render = function(rsp){
				
				scene.setDataSource('wof', { type: 'GeoJSON', data: {} });
				on_screenshot(rsp);
			    };

			    scene.screenshot().then(on_render);
			};

			scene.updateConfig({ rebuild: true }).then(function() {  });
			scene.updateConfig({ rebuild: true }).then(on_rebuild);

		    };

		    var on_fail = function(){
			console.log("sad face");
		    };

		    mapzen.whosonfirst.net.fetch(url, on_fetch, on_fail);
		    return false;
		}
	};

	return self;
})();

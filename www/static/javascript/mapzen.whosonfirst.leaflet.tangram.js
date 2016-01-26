var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};
mapzen.whosonfirst.leaflet = mapzen.whosonfirst.leaflet || {};

mapzen.whosonfirst.leaflet.tangram = (function(){

	var _scenefile = '/spelunker/static/tangram/refill.yaml'
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

			return _scenefile;
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

					if (s}{
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
		// so commented out for now until I can add suitable
		// checks and error handling (20160126/thisisaaronland)

		/*
		'screenshot_as_file': function(){

			var fname = 'tangram-' + (+new Date()) + '.png';

			var callback = function(sh){					
				saveAs(sh.blob, fname);
			};
			
			self.screenshot(callback);
		},
		*/

		// requires https://github.com/tangrams/tangram/releases/tag/v0.5.0

		'screenshot': function(on_screenshot){

			if (! on_screenshot){

				on_screenshot = function(sh) {
					window.open(sh.url);
				};
			}

			var scene = self.scene();

			if (! scene){
				console.log("failed to retrieve scene");
				return false;
			}

			scene.screenshot().then(on_screenshot);
			return true;
		}
	};

	return self;
})();

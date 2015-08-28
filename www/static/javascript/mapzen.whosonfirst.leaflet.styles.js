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

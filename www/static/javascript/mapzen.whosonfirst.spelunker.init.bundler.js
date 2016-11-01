window.addEventListener("load", function load(event){

	mapzen.whosonfirst.api.set_endpoint('https://whosonfirst-api.dev.mapzen.com/');
	mapzen.whosonfirst.api.set_key('mapzen-xQN8mJA');

	var bundler = document.getElementById('wof-bundler');
	var btn = document.getElementById('btn-bundle');
	var parent_id = btn.getAttribute('data-parent-id');
	var placetype = btn.getAttribute('data-placetype');
	var bbox = bundler.getAttribute("data-wof-bbox");
	bbox = bbox.split(",");

	map = mapzen.whosonfirst.leaflet.tangram.map_with_bbox('map', bbox);
	mapzen.whosonfirst.enmapify.render_id(map, parent_id, function(geojson) {
		mapzen.whosonfirst.enmapify.render_feature_outline(map, geojson);
	});

	btn.addEventListener('click', function(e) {
		e.preventDefault();
		this.setAttribute('disabled', 'disabled');
		this.innerHTML = 'Bundling...';

		var on_success = function(features) {
			feature_collection = {
				'type': 'FeatureCollection',
				'features': features,
			};
			var args = {
				type: "application/json"
			};
			var json = JSON.stringify(feature_collection);
			var blob = new Blob([json], args);
			var filename = 'bundle_' + parent_id + '_' + placetype + '.geojson';
			saveAs(blob, filename);
		};

		var on_error = function(rsp) {
			console.error('womp womp');
		};

		var on_wof = function(feature, index, total) {
			btn.innerHTML = 'Bundling... (' + parseInt(index + 1) + ' / ' + parseInt(total) + ')';
			mapzen.whosonfirst.bundler.render_feature(feature);
		};

		mapzen.whosonfirst.bundler.bundle(parent_id, placetype, on_success, on_error, on_wof);
	}, false);
});

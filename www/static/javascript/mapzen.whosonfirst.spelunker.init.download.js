window.addEventListener("load", function load(event){

	var total = 0;

	var bundler = document.getElementById('wof-bundler');
	var status = document.getElementById('bundle-status');
	var parent_id = bundler.getAttribute('data-parent-id');
	var checkboxes = bundler.querySelectorAll('input.placetype');
	var btn_start = document.getElementById('btn-start');
	var btn_bundle = document.getElementById('btn-bundle');
	var btn_summary = document.getElementById('btn-summary');
	var summary_stats = document.getElementById('summary-stats');
	var bundle_stats = document.getElementById('bundle-stats');

	var bbox = bundler.getAttribute("data-wof-bbox");
	bbox = bbox.split(",");

	map = mapzen.whosonfirst.leaflet.tangram.map_with_bbox('map', bbox);
	mapzen.whosonfirst.enmapify.render_id(map, parent_id, function(geojson) {
		mapzen.whosonfirst.enmapify.render_feature_outline(map, geojson);
	});
	window.map = map;

	mapzen.whosonfirst.bundler.set_handler('progress', function(update) {
		if (update.type == 'query') {
			if (update.page == update.pages) {
				btn_summary.removeAttribute('disabled');
			}
			status.innerHTML = 'Looking up ' + update.placetype + ' places (page ' + update.page + ' of ' + update.pages + ')';
		} else if (update.type == 'feature') {
			var percent = (100 * update.bundle_count / total).toFixed(1) + '%';
		        var name = update.feature.properties['wof:name'];
		        if (! name) {
			    name = update.feature.properties['wof:id'];
			}
			status.innerHTML = 'Bundled ' + percent + ': <span class="hey-look">' + name + '</span> (' + update.feature.properties['wof:placetype'] + ')';
			if (document.getElementById('preview-bundle').checked) {
				render_feature(update.feature);
			}
		} else if (update.type == 'bundle') {
			if (update.bundle_count == 0) {
				bundle_stats.innerHTML = '';
			} else {
				bundle_stats.innerHTML = 'GeoJSON bundle: ' + display_filesize(update.bundle_size);
			}
		} else if (update.type == 'summary') {
			if (update.summary_count == 0) {
				summary_stats.innerHTML = '';
			} else {
				summary_stats.innerHTML = 'CSV summary: ' + display_filesize(update.summary_size);
			}
		}
	});

	mapzen.whosonfirst.bundler.set_handler('success', function(geojson) {
	    document.getElementById('bundle-btns').className = '';
	    document.getElementById('stats').className = '';
	    status.innerHTML = '';
	});

	mapzen.whosonfirst.bundler.set_handler('error', function(details) {
		if (details && details.error && details.error.message) {
			status.innerHTML = 'Error: ' + details.error.message;
			if (details.error.code) {
				status.innerHTML += ' (' + details.error.code + ')';
			}
		} else {
			status.innerHTML = 'Error: something went wrong, but I don’t know what.';
		}
	});

	document.getElementById('preview-bundle').addEventListener('change', function(e) {
		if (e.target.checked) {
			var bundle = mapzen.whosonfirst.bundler.bundle_features();
			for (var i in bundle.features) {
				render_feature(bundle.features[i]);
			}
		} else {
			map.eachLayer(function(layer) {
				if (layer.wof_id) {
					map.removeLayer(layer);
				}
			});
		}
	});

	var include = [];
	var include_match = window.location.search.match(/include=([^&]+)/);
	if (include_match) {
		include = include_match[1].split(',');
	}

	var checkbox_changed = function(checkbox) {
		var item = checkbox.parentNode;
		var count = item.getAttribute('data-count');
		count = parseInt(count);
		var pt = item.getAttribute('data-placetype');
		if (checkbox.checked) {
			total += count;
			if (checkbox.getAttribute('id') == 'pt-self') {
				mapzen.whosonfirst.bundler.enqueue_feature(parent_id);
			} else {
				mapzen.whosonfirst.bundler.enqueue_placetype(pt, parent_id);
			}
		} else {
			total -= count;
			mapzen.whosonfirst.bundler.dequeue_placetype(pt);
			map.eachLayer(function(layer) {
				if (layer.placetype == pt) {
					map.removeLayer(layer);
				}
			});
		}
	    var plural = (total == 1) ? '' : 's';
	    document.getElementById('selected-count').innerHTML = 'You have selected <span class="hey-look">' + total.toLocaleString() + '</span> feature' + plural + '.';
	    if (total > 0) {
		document.getElementById('start-btn').className = '';
	    } else {
		document.getElementById('start-btn').className = 'hidden';
	    }
	};

	for (var i = 0; i < checkboxes.length; i++){
		var item = checkboxes[i].parentNode;
		var pt = item.getAttribute('data-placetype');
		checkboxes[i].checked = include.indexOf(pt) != -1;
		if (checkboxes[i].checked) {
			checkbox_changed(checkboxes[i]);
		}
		checkboxes[i].addEventListener('change', function(e){
			checkbox_changed(e.target);
		}, false);
	    checkboxes[i].removeAttribute('disabled');
	}

    btn_start.addEventListener('click', function(e) {
	mapzen.whosonfirst.bundler.bundle();
	document.getElementById('start-btn').className = 'hidden';
	for (var i = 0; i < checkboxes.length; i++) {
	    checkboxes[i].setAttribute('disabled', 'disabled');
	}
	document.getElementById('edit-selection').className = '';
	document.getElementById('output').className = '';
    });

    document.getElementById('edit-selection').addEventListener('click', function(e) {
	e.preventDefault();
	mapzen.whosonfirst.bundler.pause();
	document.getElementById('btn-start').innerHTML = 'Done editing';
	document.getElementById('start-btn').className = '';
	document.getElementById('edit-selection').className = 'hidden';
	document.getElementById('output').className = 'hidden';
	for (var i = 0; i < checkboxes.length; i++) {
	    checkboxes[i].removeAttribute('disabled');
	}
    });

	btn_bundle.addEventListener('click', function(e) {
		e.preventDefault();
		if (btn_bundle.getAttribute('disabled') == 'disabled') {
			return;
		}
		var types = get_chosen_types().join('-');
		var filename = 'wof_bundle_' + parent_id + '_' + types + '.geojson';
		mapzen.whosonfirst.bundler.save_bundle(filename);
	}, false);

	btn_summary.addEventListener('click', function(e) {
		e.preventDefault();
		if (btn_summary.getAttribute('disabled') == 'disabled') {
			return;
		}
		var types = get_chosen_types().join('-');
		var filename = 'wof_bundle_' + parent_id + '_' + types + '.csv';
		mapzen.whosonfirst.bundler.save_summary(filename);
	}, false);

	function render_feature(feature) {
		var props = feature['properties'];
		var geom = feature['geometry'];

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
			label_text += ', whose centroid is ';
			label_text += lat + ", " + lon;

			pt['properties']['lflt:label_text'] = label_text;

			var style = mapzen.whosonfirst.leaflet.styles.math_centroid();
			var handler = mapzen.whosonfirst.leaflet.handlers.point(style);

			var layer = mapzen.whosonfirst.leaflet.draw_point(map, pt, style, handler);
		} else {

			feature['properties']['lflt:label_text'] = feature['properties']['wof:name'];
			var layer = mapzen.whosonfirst.leaflet.draw_poly(map, feature, mapzen.whosonfirst.leaflet.styles.consensus_polygon());
		}

		layer.wof_id = props['wof:id'];
		layer.placetype = props['wof:placetype'];

	}

	function get_chosen_types() {
		var types = [];
		for (var i = 0; i < checkboxes.length; i++){
			if (checkboxes[i].checked) {
				var item = checkboxes[i].parentNode;
				var placetype = item.getAttribute('data-placetype');
				types.push(placetype);
			}
		}
		return types;
	}

	function display_filesize(bytes) {
		if (bytes < 1024 * 1024) {
			if (Math.round(bytes / 1024) == 0) {
				return (bytes / 1024).toFixed(1) + ' KB';
			} else {
				return Math.round(bytes / 1024) + ' KB';
			}
		} else {
			return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
		}
	}
});

window.addEventListener("load", function load(event){

	mapzen.whosonfirst.api.set_endpoint('https://whosonfirst-api.dev.mapzen.com/');
	mapzen.whosonfirst.api.set_key('mapzen-xQN8mJA');

	var total = 0;

	var bundler = document.getElementById('wof-bundler');
	var status = document.getElementById('bundle-status');
	var parent_id = bundler.getAttribute('data-parent-id');
	var checkboxes = bundler.querySelectorAll('input[type="checkbox"]');
	var btn = document.getElementById('btn-download');

	mapzen.whosonfirst.bundler.set_handler('progress', function(update) {
		btn.setAttribute('disabled', 'disabled');
		if (update.type == 'query') {
			status.innerHTML = 'Looking up ' + update.placetype + ' places (page ' + update.page + ' of ' + update.pages + ')';
		} else if (update.type == 'feature') {
			status.innerHTML = 'Downloaded ' + update.count + ' of ' + total + ': ' + update.feature.properties['wof:name'] + ' (' + update.feature.properties['wof:placetype'] + ')';
		}
	});

	mapzen.whosonfirst.bundler.set_handler('success', function(geojson) {
		if (geojson.features.length == 0) {
			btn.setAttribute('disabled', 'disabled');
			status.innerHTML = '<i>No places selected</i>';
		} else {
			btn.removeAttribute('disabled');
			status.innerHTML = 'Ready to download ' + geojson.features.length + ' places';
		}
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
	}

	btn.addEventListener('click', function(e) {
		e.preventDefault();
		var types = [];
		for (var i = 0; i < checkboxes.length; i++){
			if (checkboxes[i].checked) {
				var item = checkboxes[i].parentNode;
				var placetype = item.getAttribute('data-placetype');
				types.push(placetype);
			}
		}
		var types = types.join('-');
		var filename = 'wof_bundle_' + parent_id + '_' + types + '.geojson';
		mapzen.whosonfirst.bundler.save_bundle(filename);
	}, false);
});

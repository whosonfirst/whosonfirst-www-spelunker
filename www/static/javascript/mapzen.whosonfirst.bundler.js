var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

/*

This is the "business logic" of the Bundler, handling things like queueing up
queries to the API and downloading features. For the UI code, take a look at
mapzen.whosonfirst.spelunker.init.download.js.

In short:
- A query is an API session (storing pagination state & feature IDs to download)
- The queue is a list of pending query sessions

(20170124/dphiffer)

*/

mapzen.whosonfirst.bundler = (function() {

	var _queue = [];
	var _handlers = {
		on_bundle_ready: null,
		on_error: null,
		on_api_query: null,
		on_feature_download: null
	};
	var _query = null;
	var _features = [];
	var _summary = [];
	var _discard_next = null;
	var _paused = false;
	var _filters = {};

	var self = {

		bundle: function() {
			_paused = false;
			self.process_queue();
		},

		pause: function() {
			_paused = true;
		},

		set_filter: function(key, value) {
			_filters[key] = value;
		},

		set_handler: function(handler, callback) {
			_handlers['on_' + handler] = callback;
		},

		enqueue_feature: function(id) {
			_queue.push({
				wof_id: id
			});
		},

		enqueue_placetype: function(placetype, parent_id) {
			_queue.push({
				placetype: placetype,
				parent_id: parent_id
			});
		},

		dequeue_placetype: function(placetype) {
			_queue = _queue.filter(function(q) {
				return (q.placetype != placetype);
			});
			self.filter_features(placetype);
			if (_query && _query.args.placetype == placetype) {
				_query = null;
				_discard_next = placetype;
				self.process_queue();
			}
		},

		// This removes a certain kind of placetype from the bundle
		// and the queue.
		filter_features: function(placetype) {

			_features = _features.filter(function(item) {
				return item.properties['wof:placetype'] != placetype;
			});

			_summary = _summary.filter(function(item) {
				return item['wof:placetype'] != placetype;
			});
		},

		bundle_features: function() {
			var feature_collection = {
				'type': 'FeatureCollection',
				'features': _features,
			};
			return feature_collection;
		},

		summarize_features: function() {
			var rows = [];
			var keys = [];
			var row;
			for (var i in _summary) {
				if (i == 0) {
					keys = Object.keys(_summary[0]);
					rows.push(keys);
				}
				row = [];
				for (j in keys) {
					var key = keys[j];
					row.push(_summary[i][key]);
				}
				rows.push(row);
			}
			return rows;
		},

		process_queue: function() {
			if (_paused) {
				return;
			}
			if (! _query && _queue.length > 0) {
				_query = {
					args: _queue.shift(),
					page: 1,
					done_querying: false
				};
				if (_query.args.wof_id) {
					_query.results = [{
						'wof:id': _query.args.wof_id
					}];
					self.download_feature();
				} else {
					self.query_wof_api();
				}
			} else if (_query &&
			           ! _query.done_querying) {
				_query.page++;
				self.query_wof_api();
			} else if (_query &&
			           _query.results &&
			           _query.results.length > 0) {
				self.download_feature();
			} else if (_handlers.on_bundle_ready) {
				_query = null;
				_handlers.on_bundle_ready({
					bundle: self.bundle_features()
					//bundle_size: self.get_bundle_size(),
					//summary_size: self.get_summary_size()
				});
			} else {
				_query = null;
				// Done! (But no on_bundle_ready handler set.)
			}
		},

		query_wof_api: function() {

			var method = 'whosonfirst.places.getDescendants';
			var data = {
				id: _query.args.parent_id,
				placetype: _query.args.placetype,
				page: _query.page,
				per_page: 500,
				extras: 'mz:filesize'
			};

			if (_filters.include) {
				data.include = _filters.include;
			}

			if (_filters.exclude) {
				data.exclude = _filters.exclude;
			}

			if (_query.next_query) {
				var args = _query.next_query.split('&');
				for (var i = 0; i < args.length; i++) {
					var arg = args[i].split('=');
					var key = decodeURIComponent(arg[0]);
					var value = decodeURIComponent(arg[1]);
					data[key] = value;
				}
			}

			var on_success = function(rsp) {

				if (! _query.results) {
					_query.results = [];
				}

				if (! rsp.results ||
				    rsp.results.length == 0) {
					_query.done_querying = true;
				} else {
					_query.next_query = rsp.next_query;
					_query.results.push.apply(_query.results, rsp.results);
					_summary.push.apply(_summary, rsp.results);

					var filesize = 0;
					for (var i = 0; i < rsp.results.length; i++) {
						if (rsp.results[i]['mz:filesize']) {
							filesize += parseInt(rsp.results[i]['mz:filesize']);
						}
					}
				}

				if (_handlers.on_api_query) {
					_handlers.on_api_query({
						type: 'query',
						placetype: _query.args.placetype,
						page: _query.page,
						count: rsp.results.length,
						filesize: filesize
					});
				}

				self.process_queue();
			};

			var on_error = function(rsp) {
				if (_handlers.on_error) {
					_handlers.on_error(rsp);
				}
			};

			mapzen.whosonfirst.api.call(method, data, on_success, on_error);
		},

		download_feature: function() {

			var result = _query.results.shift();
			if (_query.results.length == 0) {
				_query = null;
			}

			var wof_id = result['wof:id'];
			var wof_url = mapzen.whosonfirst.uri.id2abspath(wof_id);

			// If this was not from a WOF query (i.e., the container)
			var summarize_feature = (! result['wof:placetype']);

			var on_success = function(feature) {
				if (_discard_next == feature.properties['wof:placetype']) {
					_discard_next = null;
					return;
				}

				_features.push(feature);
				if (summarize_feature) {
					_summary.push({
						'wof:id': feature.properties['wof:id'],
						'wof:name': feature.properties['wof:name'],
						'wof:parent_id': feature.properties['wof:parent_id'],
						'wof:placetype': feature.properties['wof:placetype'],
						'wof:country': feature.properties['wof:country'],
						'wof:repo': feature.properties['wof:repo']
					});
				}

				if (_handlers.on_feature_download) {
					_handlers.on_feature_download({
						feature: feature,
						bundle_count: _features.length
					});
				}

				self.process_queue();
			};

			var on_error = function(rsp) {
				if (_handlers.on_error) {
					_handlers.on_error(rsp);
				}
			};

			mapzen.whosonfirst.net.fetch(wof_url, on_success, on_error);
		},

		get_bundle_blob: function() {
			var bundle = self.bundle_features();
			var json = JSON.stringify(bundle);
			var args = {
				type: "application/json"
			};
			var blob = new Blob([json], args);
			return blob;
		},

		get_bundle_size: function() {
			var blob = self.get_bundle_blob();
			return blob.size;
		},

		save_bundle: function(filename) {
			var blob = self.get_bundle_blob();
			saveAs(blob, filename);
		},

		get_summary_blob: function(filename) {
			var summary = self.summarize_features();
			var process_row = function(row) {
				var processed = '', value;
				for (var i = 0; i < row.length; i++) {
					value = (row[i] === null) ? '' : row[i].toString();
					if (row[i] instanceof Date) {
						value = row[i].toLocaleString();
					}
					value = value.replace(/"/g, '""');
					if (value.search(/("|,|\n)/g) >= 0) {
						value = '"' + value + '"';
					}
					if (i > 0) {
						processed += ',';
					}
					processed += value;
				}
				return processed + '\n';
			};

			var csv = '';
			for (var i = 0; i < summary.length; i++) {
				csv += process_row(summary[i]);
			}

			var args = {
				type: 'text/csv;charset=utf-8;'
			};
			var blob = new Blob([csv], args);
			return blob;
		},

		get_summary_size: function() {
			var blob = self.get_summary_blob();
			return blob.size;
		},

		save_summary: function(filename) {
			var blob = self.get_summary_blob();
			saveAs(blob, filename);
		}
	};

	return self;
})();

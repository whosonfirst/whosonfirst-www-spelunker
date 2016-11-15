var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.bundler = (function() {

	var _queue = [];
	var _handlers = {
		on_success: null,
		on_error: null,
		on_progress: null
	};
	var _query = null;
	var _features = [];
	var _summary = [];
	var _discard_next = null;

	var self = {

		set_handler: function(handler, callback) {
			_handlers['on_' + handler] = callback;
		},

		enqueue_feature: function(id) {
			_queue.push({
				wof_id: id
			});
			if (! _query) {
				self.process_queue();
			}
		},

		enqueue_placetype: function(placetype, parent_id) {
			_queue.push({
				placetype: placetype,
				parent_id: parent_id
			});
			if (! _query) {
				self.process_queue();
			}
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

		filter_features: function(placetype) {

			_features = _features.filter(function(item) {
				return item.properties['wof:placetype'] != placetype;
			});

			_summary = _summary.filter(function(item) {
				return item['wof:placetype'] != placetype;
			});

			if (_handlers.on_progress) {
				_handlers.on_progress({
					type: 'summary',
					summary_count: _summary.length,
					summary_size: self.get_summary_size()
				});
				_handlers.on_progress({
					type: 'bundle',
					bundle_count: _features.length,
					bundle_size: self.get_bundle_size()
				});
			}

			if (! _query && _queue.length == 0 && _handlers.on_success) {
				var bundle = self.bundle_features();
				_handlers.on_success(bundle);
			}
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
			if (! _query && _queue.length > 0) {
				_query = {
					args: _queue.shift(),
					page: 1
				};
				if (_query.args.wof_id) {
					_query.results = [{
						'wof:id': _query.args.wof_id
					}];
					_query.pages = 1;
					self.download_feature();
				} else {
					self.query_wof_api();
				}
			} else if (_query &&
			           _query.page < _query.pages) {
				_query.page++;
				self.query_wof_api();
			} else if (_query &&
			           _query.results &&
			           _query.results.length > 0) {
				self.download_feature();
			} else if (_handlers.on_success) {
				_query = null;
				var bundle = self.bundle_features();
				_handlers.on_success(bundle);
			} else {
				_query = null;
				// Done! (But no on_success handler set.)
			}
		},

		query_wof_api: function() {

			var method = 'whosonfirst.places.getDescendants';
			var data = {
				id: _query.args.parent_id,
				placetype: _query.args.placetype,
				page: _query.page,
				per_page: 500,
				exclude: 'nullisland'
			};

			var on_success = function(rsp) {

				_query.page = rsp.page;
				_query.pages = rsp.pages;

				if (! _query.results) {
					_query.results = [];
				}

				_query.results.push.apply(_query.results, rsp.results);
				_summary.push.apply(_summary, rsp.results);

				if (_handlers.on_progress) {
					_handlers.on_progress({
						type: 'query',
						placetype: _query.args.placetype,
						page: _query.page,
						pages: _query.pages
					});
					_handlers.on_progress({
						type: 'summary',
						summary_count: _summary.length,
						summary_size: self.get_summary_size()
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
			var wof_id = result['wof:id'];
			var wof_url = mapzen.whosonfirst.data.id2abspath(wof_id);

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
					if (_handlers.on_progress) {
						_handlers.on_progress({
							type: 'summary',
							summary_count: _summary.length,
							summary_size: self.get_summary_size()
						});
					}
				}

				if (_handlers.on_progress) {
					_handlers.on_progress({
						type: 'feature',
						feature: feature,
						bundle_count: _features.length
					});
					_handlers.on_progress({
						type: 'bundle',
						bundle_count: _features.length,
						bundle_size: self.get_bundle_size()
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

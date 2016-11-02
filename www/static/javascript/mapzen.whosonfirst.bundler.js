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
			var new_queue = [];
			for (var i in _queue) {
				if (_queue[i].placetype != placetype) {
					new_queue.push(_queue[i]);
				}
			}
			_queue = new_queue;
			self.filter_features(placetype);
			if (_query && _query.args.placetype == placetype) {
				_query = null;
				_discard_next = placetype;
				self.process_queue();
			}
		},

		filter_features: function(placetype) {
			var new_features = [];
			for (var i in _features) {
				if (_features[i].properties['wof:placetype'] != placetype) {
					new_features.push(_features[i]);
				}
			}
			_features = new_features;
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
			           _query.results &&
			           _query.results.length > 0) {
				self.download_feature();
			} else if (_query &&
			           _query.page < _query.pages) {
				_query.page++;
				self.query_wof_api();
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
				_query.results = rsp.results;
				_query.page = rsp.page;
				_query.pages = rsp.pages;

				if (_handlers.on_progress) {
					_handlers.on_progress({
						type: 'query',
						placetype: _query.args.placetype,
						page: _query.page,
						pages: _query.pages
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

			var on_success = function(feature) {
				if (_discard_next == feature.properties['wof:placetype']) {
					_discard_next = null;
					return;
				}
				_features.push(feature);
				if (_handlers.on_progress) {
					_handlers.on_progress({
						type: 'feature',
						feature: feature,
						count: _features.length
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

		save_bundle: function(filename) {
			var bundle = self.bundle_features();
			var json = JSON.stringify(bundle);
			var args = {
				type: "application/json"
			};
			var blob = new Blob([json], args);
			saveAs(blob, filename);
		}
	};

	return self;
})();

var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.bundler = (function() {

	var self = {

		bundle: function(parent_id, placetype, on_success, on_error, on_wof) {

			// Here we bundle things, so to begin we will bundle up
			// all the arguments so we can pass them around easier.
			var args = {
				parent_id: parent_id,
				placetype: placetype,
				on_success: on_success,
				on_error: on_error,
				on_wof: on_wof
			};
			var bundled = [];
			var page = 1;

			var callback = function(query, feature) {
				if (query.results && query.results.length > 0) {
					self.download_feature(args, query, bundled, callback);
				} else if (query.page < query.pages) {
					page++;
					self.query_wof_api(args, page, callback);
				} else if (args.on_success) {
					args.on_success(bundled);
				}
			};

			self.query_wof_api(args, page, callback);
		},

		query_wof_api: function(args, page, callback) {
			var method = 'whosonfirst.places.getDescendants';
			var data = {
				id: args.parent_id,
				placetype: args.placetype,
				page: page,
				per_page: 500,
				exclude: 'nullisland'
			};

			var on_error = function(rsp) {
				if (args.on_error) {
					args.on_error(rsp);
				}
			};

			mapzen.whosonfirst.api.api_call(method, data, callback, on_error);
		},

		download_feature: function(args, query, bundled, callback) {
			var result = query.results.shift();
			var wof_id = result['wof:id'];
			var wof_url = mapzen.whosonfirst.data.id2abspath(wof_id);
			$.getJSON(wof_url, function(feature) {
				bundled.push(feature);
				if (args.on_wof) {
					args.on_wof(feature);
				}
				callback(query);
			}).fail(function(rsp) {
				if (args.on_error) {
					args.on_error(rsp);
				}
			});
		}
	};

	return self;
})();

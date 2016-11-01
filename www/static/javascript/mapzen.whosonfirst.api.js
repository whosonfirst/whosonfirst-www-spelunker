var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

// for the time being this assumes jQuery is present
// that decision may change some day but not today
// (20161101/dphiffer)

mapzen.whosonfirst.api = (function() {

	var _endpoint = 'https://whosonfirst.mapzen.com/api/rest/';
	var _token = null;

	var self = {

		api_call: function(method, data, on_success, on_error) {

			if (! data['access_token']) {
				if (! _token) {
					on_error({
						ok: false,
						error: 'Please set_token first.'
					});
					return;
				} else {
					data['access_token'] = _token;
				}
			}

			data['method'] = method;

			var dothis_onerror = function(rsp){

				var parse_rsp = function(rsp){
					if (! rsp['responseText']){
						console.log("Missing response text");
						return;
					}

					try {
						rsp = JSON.parse(rsp['responseText']);
						return rsp;
					} catch (e) {
						console.log("Failed to parse response text");
						return;
					}
				};

				rsp = parse_rsp(rsp);

				if (on_error){
					on_error(rsp);
				}
			};

			var args = {
				'url': _endpoint,
				'type': 'POST',
				'data': data,
				'dataType': 'json',
				'success': on_success,
				'error': dothis_onerror
			};

			$.ajax(args);
		},

		set_endpoint: function(endpoint) {
			_endpoint = endpoint;
		},

		set_token: function(token) {
			_token = token;
		}

	};

	return self;
})();

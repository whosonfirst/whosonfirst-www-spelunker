var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.api = (function(){

	var _endpoint = 'https://whosonfirst-api.mapzen.com/';
	var _api_key = null;

	var self = {

		call: function(method, data, on_success, on_error){

			var dothis_onsuccess = function(rsp){

				if (on_success){
					on_success(rsp);
				}
			};
			var dothis_onerror = function(rsp){

				console.log(rsp);

				if (on_error){
					on_error(rsp);
				}
			};

			var form_data = data;

			if (! form_data.append){

				form_data = new FormData();

				for (key in data){
					form_data.append(key, data[key]);
				}
			}

			form_data.append('method', method);
			if (_api_key &&
			    ! form_data.api_key) {
				form_data.append('api_key', _api_key);
			}

			var onload = function(rsp){

				var target = rsp.target;

				if (target.readyState != 4){
					return;
				}

				var status_code = target['status'];
				var status_text = target['statusText'];

				var raw = target['responseText'];
				var data = null;

				try {
					data = JSON.parse(raw);
				}

				catch (e){

					dothis_onerror(self.destruct("failed to parse JSON " + e));
					return false;
				}

				if (data['stat'] != 'ok'){

					dothis_onerror(data);
					return false;
				}

				dothis_onsuccess(data);
				return true;
			};

			var onprogress = function(rsp){
				// console.log("progress");
			};

			var onfailed = function(rsp){
				dothis_onerror(self.destruct("connection failed " + rsp));
			};

			var onabort = function(rsp){
				dothis_onerror(self.destruct("connection aborted " + rsp));
			};

			// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data

			try {
				var req = new XMLHttpRequest();

				req.addEventListener("load", onload);
				req.addEventListener("progress", onprogress);
				req.addEventListener("error", onfailed);
				req.addEventListener("abort", onabort);

				req.open("POST", _endpoint, true);
				req.send(form_data);

			} catch (e) {

				dothis_onerror(self.destruct("failed to send request, because " + e));
				return false;
			}

			return false;
		},

		set_endpoint: function(endpoint) {
			_endpoint = endpoint;
		},

		set_key: function(key) {
			_api_key = key;
		},

		destruct: function(msg){

			return {
				'stat': 'error',
				'error': {
					'code': 999,
					'message': msg
				}
			};

		}
	};

	return self;
})();

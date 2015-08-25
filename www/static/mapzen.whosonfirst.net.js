var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.net = (function(){

	var whosonfirst_cache = {};

	var self = {

		'encode_query': function(query){

			enc = new Array();

			for (var k in query){
				var v = query[k];
				v = encodeURIComponent(v);
				enc.push(k + "=" + v);
			}
			
			return enc.join("&");
		},

		'fetch': function(url, on_success){

			console.log("fetch " + url);

			if (whosonfirst_cache[url]){
				
				console.log("return " + url + " from cache");
				
				if (on_success){
					on_success(whosonfirst_cache[url]);
				}
				
				return;
			}
			
			var req = new XMLHttpRequest();
			
			req.onload = function(){
				
				try {
					var geojson = JSON.parse(this.responseText);
				}
				
				catch (e){
					console.log("failed to parse " + url + ", because " + e);
					// console.log(this.responseText);
					return false;
				}
				
				whosonfirst_cache[url] = geojson;
				
				if (on_success){
					on_success(geojson);
				}
			};
			
			try {				    
				req.open("get", url, true);
				req.send();
			}
			
			catch(e){
				console.log("failed to fetch " + url + ", because ");
				console.log(e);   
			}
		},

	};

	return self;

})();

var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.spelunker = (function(){

	var self = {
		
		'toggle_data_endpoint': function(placetype){

			if (placetype == 'venue'){
				mapzen.whosonfirst.data.endpoint('https://52.27.138.134/venues/');
			}

			else {
				mapzen.whosonfirst.data.endpoint('https://s3.amazonaws.com/whosonfirst.mapzen.com/data/');
			}
		},
	};

	return self;
})();

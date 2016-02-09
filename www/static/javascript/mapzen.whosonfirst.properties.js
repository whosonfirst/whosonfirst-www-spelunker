var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.properties = (function(){

    var self = {

	'render': function(props){

	    // DEFINE ALL TEH CALLBACKS HERE (to pass to yesnofix) YEAH
	    // (20160208/thisisaaronland)

	    var pretty = mapzen.whosonfirst.yesnofix.engage(props);
	    return pretty;
	},
    };

    return self;

})();

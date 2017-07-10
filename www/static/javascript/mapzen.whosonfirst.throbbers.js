var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};
mapzen.whosonfirst.throbbers = mapzen.whosonfirst.throbbers || {};

// WET PAINT - this barely works at all, please feel free to make it better
// (20170706/thisisaaronland)

mapzen.whosonfirst.throbbers = (function(){

    var clocks = [ "🕛", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚", ];

    var self = {

	'clock': function(el, i){

	    console.log("clock with " + i);

	    if (! i){
		i = 0;
	    }

	    if (i > clocks.length){
		i = 0;
	    }

	    var span = document.getElementById("throbber");

	    if (! span){
		span = document.createElement("span");
		span.setAttribute("id", "throbber");
		span.setAttribute("class", "throbber throbber-clock");
		el.appendChild(span);
	    }

	    span.innerHTML = "";
	    span.appendChild(document.createTextNode(clocks[i]));

	    setTimeout(function(){
		self.clock(el, i+1);
	    }, 200)
	},

    };

    return self;
}());

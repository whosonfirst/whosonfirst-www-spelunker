var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

// https://tools.ietf.org/html/rfc5646
// https://www.w3.org/International/articles/language-tags/
// https://github.com/mattcg/language-tags

mapzen.whosonfirst.languify = (function() {

    var self = {
	
	'init': function(){

	},

	'languify': function(){

	    var els = document.getElementsByClassName("languify");
	    var count = els.length;

	    for (var i=0; i < count; i++){

		var el = els[i];

		if (! el){
		    continue;
		}

		self.languify_el(els[i]);
	    }

	},

	'languify_el': function(el){
	    
	    var lang = el.getAttribute("data-language");

	    if (! lang){
		console.log("Missing language");
		console.log(el);
		return;
	    }

	    el.setAttribute("title", lang);

	    var parts = lang.split("_x_");
	    var count = parts.length;

	    if (count == 1){

		el.setAttribute("class", el.getAttribute("class") + " language language-all");
	    }
	    
	    else if (count == 2){

		var major = parts[0];
		var minor = parts[1];

		el.setAttribute("class", el.getAttribute("class") + " language language-" + minor);
	    }

	    else {

		el.setAttribute("class", el.getAttribute("class") + " language language-unparsed");
	    }

	},

    };

    return self;

})();

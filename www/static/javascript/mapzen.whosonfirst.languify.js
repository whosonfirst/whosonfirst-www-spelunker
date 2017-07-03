var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.languify = (function() {

    var self = {
	
	'init': function(){

	},

	'languify': function(){

	    var els = document.getElementsByClassName("languify");
	    var count = els.length;

	    for (var i=0; i < count; i++){

		var el = els[i];

		if (el){
		    self.languify_el(els[i]);
		}

	    }

	},

	'languify_el': function(el){
	    
	    var lang = el.getAttribute("data-language");

	    if (! lang){
		return;
	    }

	    el.setAttribute("title", lang);

	    var parts = lang.split("_x_");

	    if (parts.length == 2){

		var major = parts[0];
		var minor = parts[1];

		var str_lang = self.lang2string(major);

		el.setAttribute("class", "language-" + minor);
		el.innerText = str_lang + " (" + minor + ")";
	    }

	    else {

		console.log(lang);
		console.log(parts);

		var str_lang = self.lang2string(lang);
		el.innerText = str_lang + " (all)";		
	    }

	    // console.log(lang + ", " + major + ", " + minor);
	},

	'lang2string': function(lang){

	    lang = lang.replace("_", "-");
	    return lang;
	    
	}
	
    };

    return self;

})();

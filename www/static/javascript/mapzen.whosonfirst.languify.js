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
		    console.log("WTF MISSING " + i);
		    console.log(els[i]);
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

		var str_lang = self.lang2string(lang);

		el.setAttribute("class", el.getAttribute("class") + " language language-all");
		el.innerText = str_lang;
	    }
	    
	    else if (count == 2){

		var major = parts[0];
		var minor = parts[1];

		var str_lang = self.lang2string(major);

		el.setAttribute("class", el.getAttribute("class") + " language language-" + minor);
		el.innerText = str_lang;
	    }

	    else {

		el.setAttribute("class", el.getAttribute("class") + " language language-unparsed");
		el.innerText = str_lang;
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

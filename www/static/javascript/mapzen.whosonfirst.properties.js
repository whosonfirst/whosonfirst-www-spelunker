var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.properties = (function(){

    var self = {

	'render': function(props){

	    var possible_wof = [
		'wof.belongsto',
		'wof.parent_id', 'wof.children',
		'wof.breaches',
		'wof.supersedes',
		'wof.superseded_by',
		// TO DO : please to write js.whosonfirst.placetypes...
		'wof.hierarchy.continent_id', 'wof.hierarchy.country_id', 'wof.hierarchy.region_id',
		'wof.hierarchy.county_id', 'wof.hierarchy.locality_id', 'wof.hierarchy.neighbourhood_id',
		'wof.hierarchy.campus_id', 'wof.hierarchy.venue_id'
	    ];

	    var text_callbacks = {
		'wof.id': mapzen.whosonfirst.yesnofix.render_code,
		'wof.placetype': self.render_placetype,
		'wof.concordances.gn:id': self.render_geonames_id,
		'wof.concordances.gp:id': self.render_woedb_id,
		'wof.concordances.woe:id': self.render_woedb_id,
		'wof.concordances.tgn:id': self.render_tgn_id,
		'wof.lastmodified': mapzen.whosonfirst.yesnofix.render_timestamp,
		'wof.megacity': self.render_megacity,
		'wof.tags': self.render_wof_tags,
		'wof.name': self.render_wof_name,
		'sg.city': self.render_simplegeo_city,
		'sg.postcode': self.render_simplegeo_postcode,
		'sg.tags': self.render_simplegeo_tags,
		'sg.classifier': self.render_simplegeo_classifiers,
	    };
	
	    var text_renderers = function(d, ctx){

		if ((possible_wof.indexOf(ctx) != -1) && (d > 0)){
		    return self.render_wof_id;
		}

		else if (ctx.match(/^name-/)){
		    return self.render_wof_name;
		}

		else if (ctx.match(/^sg-classifiers-/)){
		    return self.render_simplegeo_classifiers;
		}

		else if (text_callbacks[ctx]){
		    return text_callbacks[ctx];
		}

		else {
		    return null;
		}
	    };

	    var dict_mappings = {
		'wof.concordances.dbp:id': 'dbpedia',
		'wof.concordances.fb:id': 'freebase',
		'wof.concordances.fct:id': 'factual',
		'wof.concordances.gn:id': 'geonames',
		'wof.concordances.gp:id': 'geoplanet',
		'wof.concordances.loc:id': 'library of congress',
		'wof.concordances.nyt:id': 'new york times',
		'wof.concordances.wd:id': 'wikidata',
		// please build me on the fly using mz.wof.placetypes
		'wof.hierarchy.continent_id': 'continent',
		'wof.hierarchy.country_id': 'country',
		'wof.hierarchy.region_id': 'region',
		'wof.hierarchy.county_id': 'county',
		'wof.hierarchy.locality_id': 'locality',
		'wof.hierarchy.neighbourhood_id': 'neighbourhood',
	    };

	    var dict_renderers = function(d, ctx){

		// TO DO: something to match 3-letter language code + "_x_" + suffix
		// or more specifically something to match/ convert 3-letter language
		// codes wrapped up in a handy library (20160211/thisisaaronland)

		if (dict_mappings[ctx]){
		    return function(){
			return dict_mappings[ctx];
		    };
		}

		return null;
	    };

	    var text_exclusions = function(d, ctx){

		return function(){

		    if (ctx.match(/^geom/)){
			return true;
		    }

		    else if ((ctx.match(/^edtf/)) && (d == "uuuu")){
			return true;
		    }

		    else if (ctx == 'wof.lastmodified'){
			return true;
		    }

		    else {
			return false;
		    }
		};

	    };

	    mapzen.whosonfirst.yesnofix.set_submit_handler(self.submit_handler);

	    mapzen.whosonfirst.yesnofix.set_custom_renderers('text', text_renderers);
	    mapzen.whosonfirst.yesnofix.set_custom_renderers('dict', dict_renderers);

	    mapzen.whosonfirst.yesnofix.set_custom_exclusions('text', text_exclusions);
	    
	    var pretty = mapzen.whosonfirst.yesnofix.render(props);
	    return pretty;
	},

	// TO DO : make 'mapzen.whosonfirst.spelunker.abs_root_url' something like
	// 'mapzen.whosonfirst.common.abs_root_url' or equivalent...

	'render_wof_id': function(d, ctx){
	    var root = mapzen.whosonfirst.spelunker.abs_root_url();
	    var link = root + "id/" + encodeURIComponent(d) + "/";
	    var el = mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	    
	    var text = el.children[0];
	    text.setAttribute("data-value", mapzen.whosonfirst.php.htmlspecialchars(d));
	    text.setAttribute("class", "props-uoc props-uoc-name props-uoc-name_" + mapzen.whosonfirst.php.htmlspecialchars(d));
	    
	    return el;
	    
	},

	'render_wof_placetype': function(d, ctx){
	    var root = mapzen.whosonfirst.spelunker.abs_root_url();
	    var link = root + "placetypes/" + encodeURIComponent(d) + "/";
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_geonames_id': function(d, ctx){
	    var link = "http://geonames.org/" + encodeURIComponent(d) + "/";
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_woedb_id': function(d, ctx){
	    var link = "https://woe.spum.org/id/" + encodeURIComponent(d) + "/";
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_tgn_id': function(d, ctx){
	    var link = "http://vocab.getty.edu/tgn/" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_megacity': function(d, ctx){
	    var root = mapzen.whosonfirst.spelunker.abs_root_url();
	    var link = root + "megacities/";
	    return mapzen.whosonfirst.yesnofix.render_link(link, "HOW BIG WOW MEGA SO CITY", ctx);
	},

	'render_wof_tags': function(d, ctx){
	    var root = mapzen.whosonfirst.spelunker.abs_root_url();
	    var link = root + "tags/" + encodeURIComponent(d) + "/";
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_wof_name': function(d, ctx){
	    var root = mapzen.whosonfirst.spelunker.abs_root_url();
	    var link = root + "search/?q=" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_simplegeo_city': function(d, ctx){
	    var root = mapzen.whosonfirst.spelunker.abs_root_url();
	    var link = root + "search/?q=" + encodeURIComponent(d) + "&placetype=locality";
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);	    
	},
	
	'render_simplegeo_postcode': function(d, ctx){
	    var root = mapzen.whosonfirst.spelunker.abs_root_url();
	    var link = root + "postalcodes/" + encodeURIComponent(d) + "/";
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);	    
	},

	'render_simplegeo_classifiers': function(d, ctx){
	    var root = mapzen.whosonfirst.spelunker.abs_root_url();
	    var link = root + "categories/" + encodeURIComponent(d) + "/";
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_simplegeo_tags': function(d, ctx){
            var root = mapzen.whosonfirst.spelunker.abs_root_url();
            var link = root + "tags/" + encodeURIComponent(d) + "/";
            return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	// pending a final working soundbox installation
	// (20160405/thisisaaronland)
	
	'submit_handler': function(report){

	    var close_modal = function(){
		var about = document.getElementById("yesnofix-about");
		var parent = about.parentElement;
		parent.removeChild(about);
	    };

	    var on_submit = function(){

		close_modal();

		report = encodeURIComponent(report);
		var data = "data:text/plain," + report;
		window.open(data, '_report');
	    };

	    var on_cancel = function(){
		close_modal();
	    };

	    // See this - we are purposefully re-using the CSS from the
	    // default about widget (20160405/thisisaaronland)

	    var about = document.createElement("div");
	    about.setAttribute("id", "yesnofix-about");

	    var text = document.createElement("div");
	    text.setAttribute("id", "yesnofix-about-text");

	    var head = document.createElement("h2");
	    head.appendChild(document.createTextNode("You have found an experimental feature!"));

	    var intro = document.createElement("p");
	    intro.appendChild(document.createTextNode("LET ME TELL YOU ABOUT IT..."));

	    text.appendChild(head);
	    text.appendChild(intro);

	    var close = document.createElement("div");
	    close.setAttribute("id", "yesnofix-about-submit");

	    var cancel_button = document.createElement("button");
	    cancel_button.setAttribute("id", "yesnofix-about-cancel-button");
	    cancel_button.appendChild(document.createTextNode("cancel"));

	    var submit_button = document.createElement("button");
	    submit_button.setAttribute("id", "yesnofix-about-submit-button");
	    submit_button.appendChild(document.createTextNode("submit"));

	    close.appendChild(cancel_button);
	    close.appendChild(submit_button);

	    about.appendChild(text);
	    about.appendChild(close);

	    cancel_button.onclick = on_cancel;
	    submit_button.onclick = on_submit;

	    var body = document.body;
	    body.insertBefore(about, body.firstChild);

	    return false;
	},

    };

    return self;

})();

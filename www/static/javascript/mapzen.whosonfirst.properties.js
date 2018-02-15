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
		'wof.hierarchy.continent_id', 'wof.hierarchy.country_id', 'wof.hierarchy.macroregion_id', 'wof.hierarchy.region_id',
		'wof.hierarchy.county_id', 'wof.hierarchy.localadmin_id', 'wof.hierarchy.borough_id', 'wof.hierarchy.locality_id',
		'wof.hierarchy.macrohood_id', 'wof.hierarchy.neighbourhood_id', 'wof.hierarchy.microhood_id',
		'wof.hierarchy.campus_id', 'wof.hierarchy.venue_id'
	    ];

	    var text_callbacks = {
		'wof.id': mapzen.whosonfirst.yesnofix.render_code,
		//'wof.id': mapzen.whosonfirst.render_wof_id,
		'wof.placetype': self.render_placetype,
		'wof.concordances.4sq:id': self.render_foursquare_id,
		'wof.concordances.companieshouse:number': self.render_companieshouse_number,
		'wof.concordances.gn:id': self.render_geonames_id,
		'wof.concordances.gp:id': self.render_woedb_id,
		'wof.concordances.woe:id': self.render_woedb_id,
		'wof.concordances.oa:id': self.render_ourairport_id,
		'wof.concordances.osm:node': self.render_openstreetmap_node,
		'wof.concordances.osm:way': self.render_openstreetmap_way,
		'wof.concordances.osm:rel': self.render_openstreetmap_relation,
		'wof.concordances.osm:relation': self.render_openstreetmap_relation,
		'wof.concordances.faa:code': self.render_faa_code,
		'wof.concordances.latimes:id': self.render_latimes_id,
		'wof.concordances.tgn:id': self.render_tgn_id,
		'wof.concordances.transitland:onestop_id': self.render_transitland_onestop_id,
		'wof.concordances.wd:id': self.render_wikidata_id,
		'wof.concordances.wk:page': self.render_wikipedia_page,
		'wof.lastmodified': mapzen.whosonfirst.yesnofix.render_timestamp,
		'wof.megacity': self.render_megacity,
		'wof.repo': self.render_wof_repo,
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
		'wof.concordances.4sq:id': 'foursquare',
		'wof.concordances.dbp:id': 'dbpedia',
		'wof.concordances.faa:code': 'faa',
		'wof.concordances.fb:id': 'freebase',
		'wof.concordances.fct:id': 'factual',
		'wof.concordances.gn:id': 'geonames',
		'wof.concordances.gp:id': 'geoplanet',
		'wof.concordances.icao:code': 'icao',
		'wof.concordances.iata:code': 'iata',
		'wof.concordances.latimes:id': 'los angeles times',
		'wof.concordances.loc:id': 'library of congress',
		'wof.concordances.nyt:id': 'new york times',
		'wof.concordances.oa:id': 'ourairports',
		'wof.concordances.osm:node': 'openstreetmap',
		'wof.concordances.osm:way': 'openstreetmap',
		'wof.concordances.osm:rel': 'openstreetmap',
		'wof.concordances.osm:relation': 'openstreetmap',
		'wof.concordances.qs:id': 'quattroshapes',
		'wof.concordances.transitland:onestop_id': 'transitland',
		'wof.concordances.wk:page': 'wikipedia',
		'wof.concordances.wd:id': 'wikidata',
		// please build me on the fly using mz.wof.placetypes
		'wof.hierarchy.borough_id': 'borough',
		'wof.hierarchy.continent_id': 'continent',
		'wof.hierarchy.country_id': 'country',
		'wof.hierarchy.macroregion_id': 'macro region',
		'wof.hierarchy.region_id': 'region',
		'wof.hierarchy.campus_id': 'campus',
		'wof.hierarchy.county_id': 'county',
		'wof.hierarchy.intersection': 'intersection',
		'wof.hierarchy.localadmin_id': 'local admin',
		'wof.hierarchy.locality_id': 'locality',
		'wof.hierarchy.macrohood_id': 'macro hood',
		'wof.hierarchy.neighbourhood_id': 'neighbourhood',
		'wof.hierarchy.microhood_id': 'micro hood',
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

		    else if (ctx == 'wof.geomhash'){
			return true;
		    }

		    else if (ctx == 'wof.id'){
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

	'render_wof_repo': function(d, ctx){

	    var root = 'https://github.com/whosonfirst-data/';

	    // until we switch the org

	    if (d == 'whosonfirst-data'){
		var root = 'https://github.com/whosonfirst/';
	    }
	    
	    var link = root + encodeURIComponent(d) + "/";
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_wof_placetype': function(d, ctx){
	    var root = mapzen.whosonfirst.spelunker.abs_root_url();
	    var link = root + "placetypes/" + encodeURIComponent(d) + "/";
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_foursquare_id': function(d, ctx){
	    var link = "https://www.foursquare.com/v/" + encodeURIComponent(d) + "/";
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

	'render_wikipedia_page': function(d, ctx){

	    // decodeURI("Montr%C3%A9al-Pierre_Elliott_Trudeau_International_Airport")
	    // "Montréal-Pierre_Elliott_Trudeau_International_Airport"
	    // encodeURIComponent(decodeURI("Montr%C3%A9al-Pierre_Elliott_Trudeau_International_Airport"))
	    // "Montr%C3%A9al-Pierre_Elliott_Trudeau_International_Airport"

	    d = decodeURI(d);
	    var link = "https://www.wikipedia.org/wiki/" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_wikidata_id': function(d, ctx){
	    var link = "https://www.wikidata.org/wiki/" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_transitland_onestop_id': function(d, ctx){

	    var href = "https://mobility-explorer.netlify.com/#/stops?bbox=__BBOX__&onestop_id=" + encodeURIComponent(d);
	    var link = mapzen.whosonfirst.yesnofix.render_link(href, d, ctx);

	    link.onclick = function(e){

		try {
		    var el = e.target;
		    var parent = el.parentNode;

		    var href = parent.getAttribute("href");
		    
		    var lat = document.getElementById("geom.latitude");
		    var lon = document.getElementById("geom.longitude");
		    
		    lat = parseFloat(lat.innerText);
		    lon = parseFloat(lon.innerText);

		    // this is cloned in to the spelunker repo but
		    // https://github.com/davidwood/node-geopoint

		    var gp = new GeoPoint(lat, lon, false);
		    var bounds = gp.boundingCoordinates(.5);

		    var bbox = [
			bounds[0].longitude(), bounds[0].latitude(),
			bounds[1].longitude(), bounds[1].latitude()
		    ];

		    bbox = bbox.join(",");
		    bbox = encodeURIComponent(bbox);
		    
		    href = href.replace("__BBOX__", bbox);
		    location.href = href;
		}

		catch (e) {
		    console.log("Failed to generate Transitland / Mobility Explore URL, because " + e);
		}

		return false;
	    };

	    return link;
	},

	'render_tgn_id': function(d, ctx){
	    var link = "http://vocab.getty.edu/tgn/" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_ourairport_id': function(d, ctx){
	    var link = "http://ourairports.com/airports/" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_openstreetmap_node': function(d, ctx){
	    var link = "https://openstreetmap.org/node/" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_openstreetmap_way': function(d, ctx){
	    var link = "https://openstreetmap.org/way/" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_openstreetmap_relation': function(d, ctx){
	    var link = "https://openstreetmap.org/relation/" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_faa_code': function(d, ctx){
	    var link = "http://www.fly.faa.gov/flyfaa/flyfaaindex.jsp?ARPT=" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_companieshouse_number': function(d, ctx){
	    var link = "http://data.companieshouse.gov.uk/doc/company/" + encodeURIComponent(d);
	    return mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);
	},

	'render_latimes_id': function(d, ctx){

	    var link = "http://maps.latimes.com/neighborhoods/neighborhood/" + encodeURIComponent(d);
	    var el = mapzen.whosonfirst.yesnofix.render_link(link, d, ctx);

	    el.onclick = function(e){ 

		try {
		    var el = e.target;
		    var parent = el.parentNode;
		    var href = parent.getAttribute("href");
		    
		    var pt = document.getElementById("wof.placetype");
		    pt = pt.innerText;
		    
		    if (pt == "macrohood"){
			href = href.replace("neighborhoods/neighborhood", "neighborhoods/region");
		    }
		    
		    location.href = href;
		    return false;
		}

		catch (e){
		    console.log("failed to generate latimes:id link, because " + e);
		}
	    };

	    return el;
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
		var data = "data:text/plain;charset=UTF-8," + report;
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

	    var intro = document.createElement("div");

	    var p1_sentences = [
		"Thank you for taking the time to fact-check this data.",
		"There are two pieces to any data collection project: the reporting and the collecting.",
		"If you're reading this it means that only the reporting piece is live for Who's On First.",
		"We expect the collection piece to be live shortly but in the meantime you can generate a text version of your report.",
		"Soon you will be able to send it to Who's On First directly",
		"If you'd like to know more about this project all the details are available in this blog post:",
	    ];
	    
	    var p1_text = p1_sentences.join(" ");

	    var p1 = document.createElement("p");
	    p1.appendChild(document.createTextNode(p1_text));

	    var href = "https://www.whosonfirst.org/blog/2016/04/08/yesnofix/";

	    var link = document.createElement("a");
	    link.setAttribute("href", href);
	    link.setAttribute("target", "blog");
	    link.appendChild(document.createTextNode(href));

	    var p2 = document.createElement("p");
	    p2.appendChild(link);

	    intro.appendChild(p1);
	    intro.appendChild(p2);

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

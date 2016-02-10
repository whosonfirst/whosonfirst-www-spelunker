var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.properties = (function(){

    var self = {

	'render': function(props){

	    // DEFINE ALL TEH CALLBACKS HERE (to pass to yesnofix) YEAH
	    // (20160208/thisisaaronland)
	    
	    var possible_wof = [
		'wof-belongsto',
		'wof-parent_id', 'wof-children',
		'wof-breaches',
		'wof-supersedes',
		'wof-superseded_by',
		// TO DO : please to write js-whosonfirst-placetypes...
		'wof-hierarchy-continent_id', 'wof-hierarchy-country_id', 'wof-hierarchy-region_id',
		'wof-hierarchy-county_id', 'wof-hierarchy-locality_id', 'wof-hierarchy-neighbourhood_id',
		'wof-hierarchy-campus_id', 'wof-hierarchy-venue_id'
	    ];

	    var callbacks = {
		// 'HALP': self.render_wof_id,	// ((possible_wof.indexOf(ctx) != -1) && (d > 0))
		'wof.id': mapzen.whosonfirst.yesnofix.render_code,
		'wof.placetype': self.render_placetype,
		'wof.concordances.gn:id': self.render_geonames_id,
		'wof.concordances.gp:id': self.render_woedb_id,
		'wof.concordances.woe:id': self.render_woedb_id,
		'wof.concordances.tgn:id': self.render_tgn_id,
		'wof.lastmodified': mapzen.whosonfirst.yesnofix.render_timestamp,
		'wof.megacity': self.render_megacity,
		'wof.tags': self.render_wof_tags,
		'wof.name': self.render_wof_name,			// (ctx.match(/^name-/)
		'sg.city': self.render_simplegeo_city,
		'sg.postcode': self.render_simplegeo_postcode,
		'sg.tags': self.render_simplegeo_tags,
		'sg.classifier': self.render_simplegeo_classifiers,	// ctx.match(/^sg-classifiers-/)		
	    };
	    
	    mapzen.whosonfirst.yesnofix.callbacks(callbacks);

	    var pretty = mapzen.whosonfirst.yesnofix.engage(props);
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
    };

    return self;

})();

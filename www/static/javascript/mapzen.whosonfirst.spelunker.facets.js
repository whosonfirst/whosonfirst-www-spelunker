var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};
mapzen.whosonfirst.spelunker = mapzen.whosonfirst.spelunker || {};

mapzen.whosonfirst.spelunker.facets = (function(){

    var self = {

	'get_facets': function(facet_url){

	    var t1 = new Date();

	    var on_success = function(rsp){

		var t2 = new Date();
		var secs = (t2 - t1) / 1000;

		var wrapper = document.getElementById("facets-wrapper");
		wrapper.innerHTML = "";

		var facets = self.render_facets(rsp, facet_url);
		wrapper.appendChild(facets);

		var div = document.createElement("div");
		div.setAttribute("class", "timings");
		div.appendChild(document.createTextNode("time to load facets: " + secs + " seconds"));
		wrapper.appendChild(div);

		setTimeout(function(){
		    mapzen.whosonfirst.namify.namify_wof();
		    mapzen.whosonfirst.languify.languify();
		}, 200);

	    };

	    var on_fail = function(rsp){

		var url = rsp["url"];

		var wrapper = document.getElementById("facets-wrapper");
		wrapper.setAttribute("class", "warning");

		wrapper.innerHTML = "";

		var list = document.createElement("ul");
		list.setAttribute("class", "list-inline");

		var code = document.createElement("code");
		code.appendChild(document.createTextNode(url));

		var item = document.createElement("li");
		item.appendChild(document.createTextNode("There was a problem generating facets for "));
		item.appendChild(code);

		list.appendChild(item);

		var xhr = rsp["xhr"];

		if (xhr){

		    var status = xhr["status"];
		    var message = xhr["statusText"];
		    
		    var details = document.createElement("code");
		    details.appendChild(document.createTextNode(status + " " + message));

		    var item_details = document.createElement("li");
		    item_details.appendChild(document.createTextNode("The robot monkeys report: "));
		    item_details.appendChild(details);

		    list.appendChild(item_details);
		}

		wrapper.appendChild(list);
	    };
	    
	    var req = new XMLHttpRequest();

	    req.onload = function(){
		
		try {
		    var data = JSON.parse(this.responseText);
		}
		
		catch (e){

		    mapzen.whosonfirst.log.error("failed to parse " + facet_url + ", because " + e);
		    
		    on_fail({
			url: facet_url,
			args: null,
			xhr: req
		    });
		    
		    return false;
		}
		
		on_success(data);
	    };

	    req.open("get", facet_url, true);
	    req.send();
	},
	
	'render_facets': function(rsp, url){

	    var facets = document.createElement("div");
	    facets.setAttribute("title", url);

	    for (var label in rsp){

		var details = rsp[label];
		var count = details.length;

		if (count){
		    var facet = self.render_facet(label, details, url);
		    facets.appendChild(facet);
		}
	    }

	    return facets;
	},

	'render_facet': function(label, details, facet_url){

	    var query_url = facet_url;
	    query_url = query_url.replace("facets/", "");	// hack...

	    var facet = document.createElement("div");
	    facet.setAttribute("class", "facet");

	    var pretty_label = label;

	    if (label == "is_current"){
		pretty_label = "is \"current\" -ness";
	    }

	    else if (label == "locality_id"){
		pretty_label = "locality";
	    }

	    else if (label == "region_id"){
		pretty_label = "region";
	    }

	    else if (label == "iso"){
		pretty_label = "country (ISO code)";
	    }

	    else {}

	    var span = document.createElement("span");
	    span.setAttribute("class", "hey-look");
	    span.appendChild(document.createTextNode(pretty_label));

	    var header = document.createElement("h4");
	    header.appendChild(document.createTextNode("filter by "));

	    header.appendChild(span);

	    var count_details = details.length;

	    var list = document.createElement("li");

	    if (label == "translations"){
		list.setAttribute("class", "list facet-details-list");
	    } 

	    else {
		list.setAttribute("class", "list-inline facet-details-list");
	    }
	    
	    for (var i=0; i < count_details; i++){

		var detail = details[i];

		var span = document.createElement("span");

		if (label == "concordance"){
		    span.appendChild(document.createTextNode(detail["fullname"]));
		}

		else if (label == "is_current"){

		    if (detail["key"] == 1){
			span.appendChild(document.createTextNode("current"));
		    }

		    else if (detail["key"] == 0){
			span.appendChild(document.createTextNode("not current"));
		    }

		    else {
			span.appendChild(document.createTextNode("unknown"));
		    }
		}
		
		else if (label == "iso"){

		    span.appendChild(document.createTextNode(detail["fullname"]));

		    if (detail["fullname"] != detail["key"]){
			span.setAttribute("class", "iso-country")
			span.setAttribute("data-iso-code", detail["key"]);
		    }
		}

		else if (label == "translations"){
		    span.appendChild(document.createTextNode(detail["fullname"]));
		    span.setAttribute("class", "languify")
		    span.setAttribute("data-language", detail["key"]);
		}

		else {
		    span.appendChild(document.createTextNode(detail["key"]));
		}

		if ((label == "locality_id") || (label == "region_id")){
		    span.setAttribute("class", "wof-namify")
		    span.setAttribute("title", "Who's On First ID " + detail["key"]);
		    span.setAttribute("data-wof-id", detail["key"]);
		}

		var link = document.createElement("a");
		link.setAttribute("href", query_url + "&" + label + "=" + detail["key"]);
		link.setAttribute("class", "facet_" + detail["key"] + "_" + detail["doc_count"]);

		link.appendChild(span);

		var count = document.createElement("small");
		count.appendChild(document.createTextNode(detail['doc_count']));

		var item = document.createElement("li");
		item.setAttribute("class", "facet_" + label + " facet-details-list-item");
		item.setAttribute("data-value", detail["key"]);		

		item.appendChild(link);
		item.appendChild(document.createTextNode(" "));
		item.appendChild(count);

		if (label == "translations"){

		    var link = document.createElement("a");
		    link.appendChild(document.createTextNode("without a translation"));

		    link.setAttribute("href", query_url + "&" + label + "=!" + detail["key"]);
		    link.setAttribute("class", "facet_" + detail["key"] + "_" + detail["doc_count"]);

		    var without = document.createElement("div");
		    without.setAttribute("class", "translations-missing");

		    var span = document.createElement("span");
		    span.setAttribute("class", "hey-look");
		    span.appendChild(document.createTextNode(detail["key"]));

		    without.appendChild(document.createTextNode("filter by records "));
		    without.appendChild(link);
		    without.appendChild(document.createTextNode(" for "));
		    without.appendChild(span);

		    item.appendChild(without);
		}

		list.appendChild(item);
	    }

	    var wrapper = document.createElement("div");
	    wrapper.setAttribute("class", "facet-details");

	    wrapper.appendChild(list);

	    facet.appendChild(header);
	    facet.appendChild(wrapper);

	    return facet;
	}
    };

    return self;

})();

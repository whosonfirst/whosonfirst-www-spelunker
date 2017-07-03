var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};
mapzen.whosonfirst.spelunker = mapzen.whosonfirst.spelunker || {};

mapzen.whosonfirst.spelunker.facets = (function(){

    var self = {

	'get_facets': function(facet_url){

	    var on_success = function(rsp){

		var wrapper = document.getElementById("facets-wrapper");
		wrapper.innerHTML = "";

		var facets = self.render_facets(rsp, facet_url);
		wrapper.appendChild(facets);

		mapzen.whosonfirst.namify.namify_wof();
	    };

	    var on_fail = function(rsp){

		console.log("FAILED TO FACET " + facet_url);
		console.log(rsp);

		var wrapper = document.getElementById("facets-wrapper");
		wrapper.innerHTML = "";

		wrapper.appendChild(document.createTextNode("Argh! There was a problem generating facets for " + facet_url));
	    };
	    
	    var req = new XMLHttpRequest();

	    req.onload = function(){
		
		try {
		    var data = JSON.parse(this.responseText);
		}
		
		catch (e){
		    mapzen.whosonfirst.log.error("failed to parse " + url + ", because " + e);
		    
		    on_fail({
			url: url,
			args: args,
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

	    var span = document.createElement("span");
	    span.setAttribute("class", "hey-look");
	    span.appendChild(document.createTextNode(label));

	    var header = document.createElement("h4");
	    header.appendChild(document.createTextNode("filter by "));

	    header.appendChild(span);

	    var count_details = details.length;

	    var list = document.createElement("li");
	    list.setAttribute("class", "list-inline");

	    for (var i=0; i < count_details; i++){

		var detail = details[i];

		var span = document.createElement("span");

		if (label == "concordance"){
		    span.appendChild(document.createTextNode(detail["fullname"]));
		}

		else {
		    span.appendChild(document.createTextNode(detail["key"]));
		}

		if ((label == "locality_id") || (label == "region_id")){
		    span.setAttribute("class", "wof-namify")
		    span.setAttribute("data-wof-id", detail["key"]);
		}

		var link = document.createElement("a");
		link.setAttribute("href", query_url + "&" + label + "=" + detail["key"]);
		link.setAttribute("class", "facet_" + detail["key"] + "_" + detail["doc_count"]);

		link.appendChild(span);

		var count = document.createElement("small");
		count.appendChild(document.createTextNode(detail['doc_count']));

		var item = document.createElement("li");
		item.setAttribute("class", "facet_" + label);
		item.setAttribute("data-value", detail["key"]);

		item.appendChild(link);
		item.appendChild(document.createTextNode(" "));
		item.appendChild(count);

		list.appendChild(item);
	    }

	    var wrapper = document.createElement("div");
	    wrapper.setAttribute("style", "max-height:200px;overflow:scroll;border-bottom:solid thin;margin-bottom:2em;");

	    wrapper.appendChild(list);

	    facet.appendChild(header);
	    facet.appendChild(wrapper);

	    return facet;
	}
    };

    return self;

})();

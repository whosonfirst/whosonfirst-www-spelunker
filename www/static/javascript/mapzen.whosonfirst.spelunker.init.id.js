window.addEventListener("load", function load(event){

    	var wof = document.getElementById("wof-record");
    	var wofid = wof.getAttribute("data-wof-id");
    	var bbox = wof.getAttribute("data-wof-bbox");
    	bbox = bbox.split(",");

	// first we draw the map

	var map = mapzen.whosonfirst.leaflet.tangram.map_with_bbox('map', bbox);
	mapzen.whosonfirst.enmapify.render_id(map, wofid);

	// now we format the properties hash

	var url = mapzen.whosonfirst.data.id2abspath(wofid);

	var cb = function(feature){

		var props = feature['properties'];
		var id = props['wof:id'];

		try {
		    // var pretty = mapzen.whosonfirst.spelunker.render_properties(props);
		    var pretty = mapzen.whosonfirst.yesnofix.engage(props);
		}

		catch(e) {
			mapzen.whosonfirst.log.error("failed to format properties for ID " + id + ", because " + e);
			return;
		}

		try {
			var wrapper = document.getElementById("props-wrapper");
			wrapper.appendChild(pretty);

			var raw = wrapper.children[0];
			raw.setAttribute("style", "display:none");

			//wrapper.replaceChild(pretty, raw);

			var toggle = document.getElementById("props-toggle");
			toggle.setAttribute("style", "display:block");

			var toggle_raw = document.getElementById("props-toggle-raw");
			toggle_raw.setAttribute("style", "display:block");

			toggle_raw.onclick = function(){

				raw.setAttribute("style", "display:block");
				pretty.setAttribute("style", "display:none");

				toggle_raw.setAttribute("style", "display:none");
				toggle_pretty.setAttribute("style", "display:block");
			};

			var toggle_pretty = document.getElementById("props-toggle-pretty");

			toggle_pretty.onclick = function(){

				raw.setAttribute("style", "display:none");
				pretty.setAttribute("style", "display:block");

				toggle_raw.setAttribute("style", "display:block");
				toggle_pretty.setAttribute("style", "display:none");
			};
		}

		catch (e){
			mapzen.whosonfirst.log.error("failed to render properties for ID " + id + ", because " + e);
			return;
		}

		mapzen.whosonfirst.spelunker.draw_names("props-uoc-name");
	}

	var on_fail = function(){
		mapzen.whosonfirst.log.error("failed to format and render properties, because there was a problem retrieving " + url);
	};

	mapzen.whosonfirst.net.fetch(url, cb);
        return;
});

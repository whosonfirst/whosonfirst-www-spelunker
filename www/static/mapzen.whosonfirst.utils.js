var whosonfirst_cache = {};
var whosonfirst_data = "http://whosonfirst.mapzen.com/data/";

function mapzen_whosonfirst_utils_id2abspath(id){

	var rel_path = mapzen_whosonfirst_utils_id2relpath(id);
	var abs_path = whosonfirst_data + rel_path;
	
	return abs_path;
}

function mapzen_whosonfirst_utils_id2relpath(id){

	parent = mapzen_whosonfirst_utils_id2parent(id);
	fname = mapzen_whosonfirst_utils_id2fname(id);

	var rel_path = parent + "/" + fname;
	
	return rel_path;
}

function mapzen_whosonfirst_utils_id2parent(id){

	str_id = new String(id);
	tmp = new Array();

	while (str_id.length){

		var part = str_id.substr(0, 3);
		tmp.push(part);		
		str_id = str_id.substr(3);
	}

	parent = tmp.join("/");
	return parent;
}

function mapzen_whosonfirst_utils_id2fname(id){
	return id + ".geojson";
}

function mapzen_whosonfirst_utils_fetch(url, on_success){

	console.log("fetch " + url);

	if (whosonfirst_cache[url]){

		console.log("return " + url + " from cache");

		if (on_success){
			on_success(whosonfirst_cache[url]);
		}
		
		return;
	}

	var req = new XMLHttpRequest();

	req.onload = function(){

		try {
			var geojson = JSON.parse(this.responseText);
		}

		catch (e){
			console.log("failed to parse " + url + ", because " + e);
			// console.log(this.responseText);
			return false;
		}

		whosonfirst_cache[url] = geojson;

		if (on_success){
			on_success(geojson);
		}
	};

        try {				    
		req.open("get", url, true);
		req.send();
        }
				    
        catch(e){
		console.log("failed to fetch " + url + ", because ");
		console.log(e);   
	}
	
}

var map = L.Mapzen.map('map');
map.setView([40, -112.4], 3);
// includeParent = false;

// search for country wof id


var api_key = 'mapzen-vhKiPwF';
var search = document.getElementById("wof_search_button");
var wof_search = document.getElementById("wof_search");
var wof_parent_level = document.getElementById("wof_parent_level");

search.addEventListener("click", function(){

    var wof_search_value = wof_search.value;
    var wof_parent_level_value = wof_parent_level.value;
    console.log("passing " + wof_search_value + " to WOF search");
//     search.onclick = function(){
        var xhr_search_wof = new XMLHttpRequest();
        var search_url = "https://whosonfirst-api.dev.mapzen.com/?method=whosonfirst.places.search&names=" +  wof_search_value + "&placetype=" + wof_parent_level_value + "&extras=geom:bbox&api_key=" + api_key;
//         console.log("wof search url: " + search_url);
        xhr_search_wof.open('GET', search_url, true);
        xhr_search_wof.send();
        xhr_search_wof.addEventListener("readystatechange", search_wof_countries, false);   

            function search_wof_countries(e) {
            if (xhr_search_wof.readyState == 4 && xhr_search_wof.status == 200) {
                response = JSON.parse(xhr_search_wof.responseText);
                var wof_search_top_result = response.results[0]['wof:id'];
                console.log(response);
                console.log("top result is " + wof_search_top_result);
                var wof_id = document.getElementById("wof_id");
                var wof_search_top_name = response.results[0]['wof:name'];
                wof_id.value = wof_search_top_result;
                wof_search.value = wof_search_top_name.toUpperCase() + "!";
                wof_search.style.backgroundColor = "lightgreen";
                wof_id.style.backgroundColor = "lightgreen";
                wof_parent_bbox = response.results[0]['geom:bbox'];
                var latlon = wof_parent_bbox.split(',');
                sw = [latlon[1],latlon[0]];
                ne = [latlon[3],latlon[2]];
                map.fitBounds([sw,ne]);
                var bounds = [sw,ne];
                var boundingBox = L.rectangle(bounds, {color: "#90EE90", weight: 1});
                map.addLayer(boundingBox);
            }
        } // wof_search 
        return false; 
//     }; // s.onclick  
});

window.addEventListener("load", function () {
    

    var qs = window.location.search;
	qs = qs.substring(1);
	
	var params = {};
	var queries = qs.split("&");
	var count = queries.length;
	
	for ( var i = 0; i < count; i++ ) {
		temp = queries[i].split('=');
		params[temp[0]] = temp[1];
	}   
	
// 	console.log(params);
	
	if ((params['wof_id']) && (params['wof_level'])){

        start(params['wof_id'], params['wof_level']);
        return;
	}
	
	// what would user do?
	

	
	
	
	
    var b = document.getElementById("wof_button");
    b.removeAttribute("disabled");
    
    b.onclick = function(){
        wof_search.style.backgroundColor = "white";
        wof_id.style.backgroundColor = "white";
        var wof_id = document.getElementById("wof_id");
        wof_id = wof_id.value;
        
        var wof_level = document.getElementById("wof_level");
        wof_level = wof_level.value;
        
        // console.log("wof id is " + wof_id);
        // console.log("wof level is " + wof_level);
//         wof_search.value = wof_search_value;

        try {
           start(wof_id, wof_level);
        } catch (e) {
            console.log(e);
        }
        
        return false;
    };
    
    
    
});
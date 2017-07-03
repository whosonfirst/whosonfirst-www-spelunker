window.addEventListener("load", function load(event){
    
    mapzen.whosonfirst.spelunker.draw_list('loc');

    mapzen.whosonfirst.spelunker.draw_names('facet_locality_id');
    mapzen.whosonfirst.spelunker.draw_names('facet_region_id');  

    var flags = document.getElementsByClassName("flag");
    var count = flags.length;

    for (var i =0; i < count; i++){
	var el = flags[i];
	var code = el.getAttribute("data-country");
	var alpha = ":" + code + ":";
	// console.log(alpha);

	// gggggrrnnnnggnnngnhhhhhhh...
	// el.innerHTML = String.fromCodePoint();
    }

    var facets_wrapper = document.getElementById("facets-wrapper");
    var facet_url = facets_wrapper.getAttribute("data-facet-url");

    if (facet_url){
	
	mapzen.whosonfirst.spelunker.facets.get_facets(facet_url);
    }

});

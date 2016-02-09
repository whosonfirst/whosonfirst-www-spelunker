window.addEventListener("load", function load(event){

    var map = mapzen.whosonfirst.leaflet.tangram.map_with_bbox('map', {{ doc.bbox.1|e }},{{ doc.bbox.0|e }}, {{ doc.bbox.3|e }}, {{ doc.bbox.2|e }});

    var on_fetch = function(feature){
	mapzen.whosonfirst.enmapify.render_feature_outline(map, feature);
  	mapzen.whosonfirst.spelunker.draw_list('loc');
    };
    
    mapzen.whosonfirst.enmapify.render_id(map, {{ doc.properties.get("wof:id") |e }}, on_fetch);
    
    mapzen.whosonfirst.spelunker.draw_names('facet_locality_id');
    mapzen.whosonfirst.spelunker.draw_names('facet_region_id');  
});

window.addEventListener("load", function load(event){
    
    mapzen.whosonfirst.spelunker.draw_list('loc');

    mapzen.whosonfirst.spelunker.draw_names('facet_locality_id');
    mapzen.whosonfirst.spelunker.draw_names('facet_region_id');  
});

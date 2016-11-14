window.addEventListener("load", function load(event){
    mapzen.whosonfirst.spelunker.init();

    var map = mapzen.whosonfirst.leaflet.tangram.map('map');

    slippymap.crosshairs.init(map);
});

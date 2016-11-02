window.addEventListener("load", function load(event){
    mapzen.whosonfirst.spelunker.init();

    if (document.getElementById('map')) {
        var map = mapzen.whosonfirst.leaflet.tangram.map('map');
        slippymap.crosshairs.init(map);
    }
});

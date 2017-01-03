window.addEventListener("load", function load(event){

    mapzen.whosonfirst.spelunker.init();
    mapzen.whosonfirst.chrome.init();

    var map = mapzen.whosonfirst.leaflet.tangram.map('map');

    slippymap.crosshairs.init(map);
});

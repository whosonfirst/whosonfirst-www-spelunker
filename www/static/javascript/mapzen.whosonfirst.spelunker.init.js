window.addEventListener("load", function load(event){

<<<<<<< HEAD
    if (document.getElementById('map')) {
        var map = mapzen.whosonfirst.leaflet.tangram.map('map');
        slippymap.crosshairs.init(map);
=======
    mapzen.whosonfirst.spelunker.init();

    if (document.getElementById("map")){
	var map = mapzen.whosonfirst.leaflet.tangram.map("map");
	slippymap.crosshairs.init(map);
>>>>>>> 179609b1ab06d50a5ca2cd11251b51f1ac0bd1b7
    }
});

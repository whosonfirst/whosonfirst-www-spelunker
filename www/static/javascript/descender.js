// start();
// 


function start(wof_id, wof_level) {
    //var wof_id = document.getElementById("wof_id").value;
    //var wof_level = document.getElementById("wof_level").value;
    console.log( wof_id );
    console.log( wof_level );
    //return wof_id;
    //return wof_level;

    // 
    // // test WOF IDs, level, and token   

    var wof_access_token = 'bfa3cbc6f49de8faf4d99e41c8d328f2';
    //     var wof_id = 85688637; // california
    //     var wof_id = 85632227; // tanzania
    //     var wof_id = 85633041; // canada
    //     var wof_id = 85633793; // US
    //     var wof_level = 'locality';
    //     var wof_level = 'county';
    //     var wof_level = 'region';


    // global variables for parent name`
    var wof_parent = wof_id;
    var wof_parent_name;
    var wof_parent_url = 'https://whosonfirst.mapzen.com/api/rest/?method=whosonfirst.places.getInfo&access_token=' + wof_access_token + '&id=' + wof_parent;
    var wof_parent_bbox;
    // define XHR stuff

    var xhr = new XMLHttpRequest();
    var xhr_parent = new XMLHttpRequest();
    var xhr_parent_wof = new XMLHttpRequest();

    // counters and arrays for descendants 

    var descendantsJSON = [];
    var descendantsCount = 0;
    var descendantsProcessed = 0;

    // prefix and suffix for building GeoJSON feature collection

    var features = [];
    // var featureCollectionStart = '{ "type": "FeatureCollection", "features": [ ';
    // var featureCollectionEnd = ' ] }';

    // build url for list to get list of descendants 

    var url = 'https://whosonfirst.mapzen.com/api/rest/?method=whosonfirst.places.getDescendants&access_token=' + wof_access_token + '&id=' + wof_id +'&placetype=' + wof_level + '&page=1&per_page=2000&exclude=nullisland';

    /*
    url = 'https://whosonfirst-api.dev.mapzen.com/api/rest/?method=whosonfirst.places.getDescendants&id=' + wof_id +'&placetype=' + wof_level + '&page=1&per_page=2000';
    */

    // get name of parent wof_id
    
    xhr_parent.open('GET', wof_parent_url, true);
//     console.log(wof_parent_url);
    xhr_parent.send();
    xhr_parent.addEventListener("readystatechange", get_parent_name, false);   
    
    function get_parent_name(e) {
    if (xhr_parent.readyState == 4 && xhr_parent.status == 200) {
        console.log("getting parent name: " + Date());
        response = JSON.parse(xhr_parent.responseText);
        //get parent name
        wof_parent_name = response.record['wof:name'];

        console.log("hey mom and dad: " + wof_parent_name);

        if (wof_level == "ocean") {
            wof_level = "oceans";
        }        
        if (wof_level == "county") {
            wof_level = "counties";
        }
        if (wof_level == "country") {
            wof_level = "countries";
        }
        if (wof_level == "region") {
            wof_level = "regions";
        }
        if (wof_level == "postalcode") {
            wof_level = "postal codes";
        }        
        if (wof_level == "locality") {
            wof_level = "localities";
        }           
        if (wof_level == "neighbourhood") {
            wof_level = "neighbourhoods";
        }           
        if (wof_level == "neighbourhood") {
            wof_level = "neighbourhoods";
        }  
        if (wof_level == "microhood") {
            wof_level = "microhoods";
        }                        
        if (wof_level == "disputed") {
            wof_level = "disputed areas";
        }  
        if (wof_level == "timezone") {
            wof_level = "timeszones";
        }                     
                
        // add parent name to page
        var parent_name = document.getElementById("parent_name");
        var p0 = document.getElementById("p0");
        var h2 = document.getElementById("h2");
        
        var t = document.createTextNode(wof_level + " of " + wof_parent_name + "! ");
        p0.appendChild(t);
//         parent_name.replaceChild(t,p0);

        } 
    }
    

    // get list of descendants            

    xhr.open('GET', url, true);
    xhr.send();
    xhr.addEventListener("readystatechange", process_wof_id, false);


    // check readyState of XHR request for descendant list

    function process_wof_id(e) {
    if (xhr.readyState == 4 && xhr.status == 200) {
        console.log("building URLs: " + Date());
        response = JSON.parse(xhr.responseText);
        descendantsCount = response.results.length;
        
        var parent_name = document.getElementById("parent_name");
        var p0 = document.getElementById("p0");
        var h2 = document.getElementById("h2");
        var t = document.createTextNode(wof_parent_name + "! ");
        
        // loop through list and parse WOF IDs to build URLs
        for (var i = 0; i < descendantsCount; i++) {
            var wof_id = response.results[i]['wof:id'];
            var wof_name = response.results[i]['wof:name'];
            console.log(wof_name + ": " + wof_level);
            
            // add descendent names to page
//             var descendant_name = document.getElementById("descendant_name");
//             var child = document.getElementById("p1");
//             var node = document.createTextNode(wof_name + "! ");
//             descendant_name.appendChild(node);
            
            
            var wof_url = []; 
            wof_url[i] = makeWOFURL(wof_id);
            console.log(wof_url[i]);
            //get the URL of a descendant 
            var xhr2 = new XMLHttpRequest();
            xhr2.open('GET', wof_url[i], true);
            console.log("getting " + i);
            xhr2.send();
            xhr2.addEventListener("readystatechange", process_wof_descendant, false);
        } //for
    
        // count and wait
    
        var wait = function() {
            console.log("WAITING..." + descendantsProcessed + " of " + descendantsCount);
             if (descendantsProcessed < descendantsCount){
                            setTimeout(wait, 500);
                            console.log("buffering...");
                            return;
            }
            feature_collection = {
                'type': 'FeatureCollection',
                'features': features,
            }
            
            // add to map

//             L.geoJson(feature_collection).addTo(map);
            
            // dump GeoJSON into blob


            console.log("starting blob " + Date());
            var args = {type: "application/json"};
            var blob = new Blob([JSON.stringify(feature_collection)], args);
            console.log("stopping blob " + Date());
            var filename = wof_parent_name + '_' + wof_parent + '_' + wof_level + '_' + descendantsCount + '.geojson'
            saveAs(blob, filename);
        }

        wait();
        } //if
    } //function

    function process_wof_descendant(e) {
    if (this.readyState == 4 && this.status == 200) {
        // add JSON to body
        this.wofJSON = this.responseText;  
        feature = JSON.parse(this.responseText);
        features.push(feature); 
        
        // move map to the bounding box on first descendant 
        var lat = feature.properties['lbl:latitude'];
        console.log('lat ' + lat);
        var lon = feature.properties['lbl:longitude'];
        console.log('lon ' + lon);
//         var bbox[];
//         bbox = feature.properties['geom:bbox'];
    if (descendantsProcessed == 0){
        map.panTo([lat,lon]);
        }
//         map.fitBounds([bbox[0],bbox[1]]
//         ,[bbox[2],bbox[3]]);
        
        // add geojson to map
        L.geoJson(feature, {style: {weight:2}}).addTo(map);

        var wof_name = feature.properties['wof:name'];
        var descendant_name = document.getElementById("descendant_name");
        var child = document.getElementById("p1");
        var node = document.createTextNode((1 + descendantsProcessed) + ": " + wof_name + "! ");
        descendant_name.appendChild(node);

        console.log('processed: ' + (1 + descendantsProcessed) + ' of ' + descendantsCount);
        descendantsProcessed++;
        

        } else {
        console.log("uh oh");
        }

    }


    function makeWOFURL(wof_id) {
    // parse the ID into groups of three to build the WOF url
    var id = wof_id.toString();
    var wof = [];
    for (var i = 0; i < id.length; i = i + 3) {
        var j = ((i + 3)/3) - 1;
        wof[j] = id.slice(i, i + 3);
    }
    var wof_url_prefix = 'https://whosonfirst.mapzen.com/data/';
    var wof_url_suffix =  id + '.geojson';
    var wof_url_middle = '';
    var i = 0;   
    while (wof[i]) {
        wof_url_middle += wof[i] + '/';
        i++;
    }
    if (id == 0) {
    wof_url_middle = "0/";
    wof_url_suffix = '0.geojson';
    }
    wof_url = wof_url_prefix + wof_url_middle + wof_url_suffix;
    return wof_url;
    }

    function topojsonify() {
    // holding spot for topojson conversion
    }

}

window.addEventListener("load", function load(event){

    var bundler = document.getElementById('wof-bundler');
    var parent_id = bundler.getAttribute('data-parent-id');
    var placetype = bundler.getAttribute('data-placetype');

    console.log('Ok, let’s download ' + parent_id + '’s ' + placetype + ' descendents!');

});

var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.cache = (function() {

    var default_cache_ttl = 30000; // ms
    var disable_cache = false;

    var null_handler = function(key){
        return key;
    };

    var self = {

	'_handlers' : {
	    'prep_key': null_handler,
	},

        'set_handler': function(target, handler){

            if (! self._handlers[target]){
                console.log("[cache]", "MISSING", target);
                return false;
            }
	    
            if (typeof(handler) != "function"){
                console.log("[cache]", "INVALID", taget, handler);
                return false;
            }
	    
            self._handlers[target] = handler;
        },
	
        'get_handler': function(target){
	    
            if (! self._handlers[target]){
                return false;
            }
	    
            return self._handlers[target];
        },
	
	'get': function(key, on_hit, on_miss, cache_ttl){

	    if (typeof(localforage) != 'object'){
		return false;
	    }
	    
	    var fq_key = self.prep_key(key);

	    localforage.getItem(fq_key, function (err, rsp){
			    
		if ((err) || (! rsp)){
		    on_miss();
		    return;
		}
		
		var data = rsp['data'];
		
		if (! data){
		    on_miss();
		    return;
		}
		
		var dt = new Date();
		var ts = dt.getTime();
		
		var then = rsp['created'];
		var diff = ts - then;
		
		if (diff > cache_ttl){
		    self.unset(key);
		    on_miss();
		    return;
		}
		
		on_hit(data);
	    });
	    
	    return true;
	},

	'set': function(key, data){

	    if (typeof(localforage) != 'object'){
		return false;
	    }
	    
	    if (disable_cache){
		return false;
	    }
	    
	    var dt = new Date();
	    var ts = dt.getTime();
	    
	    var wrapper = {
		'data': value,
		'created': ts
	    };
	    
	    var fq_key = self.prep_key(key);
	    
	    localforage.setItem(fq_key, wrapper).then(function(v){
		// woo woo
	    }).catch(function(err){
		
		// https://github.com/whosonfirst/whosonfirst-www-spelunker/issues/126
		
		if (err['code'] == 4){
		    disable_cache = true;
		}

		console.log("[cache]", "ERR", err);
	    });
	    
	    return true;
	},

	'unset': function(key){

	    if (typeof(localforage) != 'object'){
		return false;
	    }
	    
	    key = self.prep_key(key);
	    
	    localforage.removeItem(key);
	    return true;
	},

	'prep_key': function(key){
	    var f = self.get_handler('prep_key');
	    return f(key);
	},
	
	
    };
    
    return self;

})();

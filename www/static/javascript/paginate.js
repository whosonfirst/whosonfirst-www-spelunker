window.addEventListener("load", function load(event){

	var prev = document.getElementById("previous-page");
	var next = document.getElementById("next-page");
	
	document.addEventListener('keydown', function(e){
		
		var loc;
		
		if ((e.keyCode == 37) && (prev)){
			loc = prev.getAttribute("href");
		}
		
		if ((e.keyCode == 39) && (next)){
			loc = next.getAttribute("href");
		}
		
		if (loc){
			location.href = loc;
		}
	});
	
	// https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
	// https://developer.mozilla.org/en-US/docs/Web/API/Touch
	// https://developer.mozilla.org/en-US/docs/Web/Events/mousedown
	
	var lookup = {};
	var swipe = parseInt(window.innerWidth / 3);
	
	/*
	  document.addEventListener("mousedown", function(e){
	  
	  lookup["mouse"] = e.screenX;
	  });
	  
	  document.addEventListener("mouseup", function(e){
	  
	  if (e.movementX < swipe){
	  return;
	  }
	  
	  var last = lookup["mouse"];
	  var current = e.screenX;
	  
	  if ((current > last) && (next)){
	  loc = next.getAttribute("href");
	  }
	  
	  if ((current < last) && (prev)){
	  loc = prev.getAttribute("href");
	  }
	  
	  if (loc){
	  location.href = loc;
	  }
	  });
	*/
	
	document.addEventListener("touchstart", function(e){
		
		var touches = e.touches;
		var count = touches.length;
		
		if (count > 1){
			return;
		}
		
		for (var i=0; i < count; i++){
			
			var t = touches[i];
			var tid = t.identifier;
			
			lookup[tid] = t.screenX;
		}
	});
	
	// https://developer.mozilla.org/en-US/docs/Web/Events/touchend
	
	document.addEventListener("touchmove", function(e){
		
		var touches = e.touches;
		var count = touches.length;
		
		if (count > 1){
			return;
		}
		
		var loc;
		
		for (var i=0; i < count; i++){
			
			var t = touches[i];
			var tid = t.identifier;

			var last = lookup[tid];
			var current = t.screenX;
			
			// see this - it looks backwards but it makes sense on a screen...
			
			if ((current > last) && ((current - last) > swipe) && (next)){
				loc = prev.getAttribute("href");
				break;
			}
			
			if ((current < last) && ((last - current) > swipe) && (prev)){
				loc = next.getAttribute("href");
				break;
			}
		}
		
		if (loc){
			location.href = loc;
		}
		
	});
	
});

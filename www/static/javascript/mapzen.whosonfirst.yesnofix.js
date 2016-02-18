var mapzen = mapzen || {};
mapzen.whosonfirst = mapzen.whosonfirst || {};

mapzen.whosonfirst.yesnofix = (function(){

    var status_map = {
	'fix': -1,
	'no': 0,
	'yes': 1
    };

    var _custom_renderers = {
	'dict': function(d, ctx){ return null; },
	'text': function(d, ctx){ return null; },
    };

    var assertions = [];

    var current = null;

    var self = {

	'set_custom_renderers': function(t, r){

	    if (! _custom_renderers[t]){
		return;
	    }

	    if (! r){
		return;
	    }

	    _custom_renderers[t] = r;
	},

	'get_custom_renderer': function(t, d, ctx){

	    if (! _custom_renderers[t]){
		return null;
	    }

	    var custom = _custom_renderers[t];
	    return custom(d, ctx);
	},
	
	// please do not call these 'engage' or 'makeitso' ...
	
	'makeitso': function(data, target){
	    
	    var el = document.getElementById(target);
	    
	    if (! el){
		return false;
	    }
	    
	    var pretty = self.engage(data);
	    el.appendChild(pretty);
	    
	    return true;
	},
	
	'engage': function(props){
	    
	    var pretty = document.createElement("div");
	    pretty.setAttribute("id", "yesnofix-pretty");
	    
	    buckets = self.bucket_props(props);
	    
	    var namespaces = Object.keys(buckets);
	    namespaces = namespaces.sort();
	    
	    var count_ns = namespaces.length;
	    
	    for (var i=0; i < count_ns; i++){
		var ns = namespaces[i];
		var dom = self.render_bucket(ns, buckets[ns]);
		pretty.appendChild(dom);
	    }
	    
	    return pretty;				
	},
	
	'render_bucket': function(ns, bucket){
	    
	    var wrapper = document.createElement("div");
	    
	    var header = document.createElement("h3");
	    var content = document.createTextNode(ns);
	    header.appendChild(content);
	    
	    var sorted = self.sort_bucket(bucket);
	    var body = self.render(sorted, ns);
	    
	    wrapper.appendChild(header);
	    wrapper.appendChild(body);
	    
	    return wrapper;
	},
	
	'render': function(d, ctx){
	    
	    if (Array.isArray(d)){
		// console.log("render list for " + ctx);
		return self.render_list(d, ctx);
	    }
	    
	    else if (typeof(d) == "object"){
		// console.log("render dict for " + ctx);
		return self.render_dict(d, ctx);
	    }
	    
	    else {
		// console.log("render text for " + ctx);

		var wrapper = document.createElement("span");
		wrapper.setAttribute("class", "yesnofix-content");

		var trigger = self.render_trigger(ctx);
		wrapper.appendChild(trigger);

		var content;

		var renderer = self.get_custom_renderer('text', d, ctx);
		// console.log("rendered for " + ctx + " : " + typeof(renderer));

		if (renderer){
		    try {
			content = renderer(d, ctx);
		    } catch (e) {
			console.log("UNABLE TO RENDER " + ctx + " BECAUSE " + e);
		    }
		}

		else {
		    content = self.render_text(d, ctx);
		}

		wrapper.appendChild(content);

		return wrapper;
	    }
	},
	
	'render_dict': function(d, ctx){
	    
	    var table = document.createElement("table");
	    table.setAttribute("class", "table");
	    
	    for (k in d){
		
		var row = document.createElement("tr");
		var label_text = k;

		var _ctx = (ctx) ? ctx + "." + k : k;

		var renderer = self.get_custom_renderer('dict', d, _ctx);

		if (renderer){
		    try {
			label_text = renderer(d, _ctx);
		    } catch (e) {
			console.log("UNABLE TO RENDER " + _ctx + " BECAUSE " + e);
		    }
		}

		/*
		  unclear if the rule should just be only text (as it currently is)
		  or whether custom markup is allowed... smells like feature quicksand
		  so moving along for now (20160211/thisisaaronland)
		 */

		var header = document.createElement("th");
		var label = document.createTextNode(mapzen.whosonfirst.php.htmlspecialchars(label_text));
		header.appendChild(label);
		
		var content = document.createElement("td");

		var body = self.render(d[k], _ctx);		
		content.appendChild(body);

		row.appendChild(header);
		row.appendChild(content);
		
		table.appendChild(row);
	    }
	    
	    return table;
	},
	
	'render_list': function(d, ctx){
	    
	    var count = d.length;
	    
	    if (count == 0){
		return self.render_text("–", ctx);
	    }
	    
	    if (count <= 1){
		return self.render(d[0], ctx);
	    }
	    
	    var list = document.createElement("ul");
	    
	    for (var i=0; i < count; i++){
		
		var item = document.createElement("li");
		var body = self.render(d[i], ctx + "#" + i);
		
		item.appendChild(body);
		list.appendChild(item);
	    }
	    
	    return list;
	},
	
	'render_text': function(d, ctx){
	    
	    var text = mapzen.whosonfirst.php.htmlspecialchars(d);
	    
	    var span = document.createElement("span");
	    span.setAttribute("id", ctx);
	    span.setAttribute("title", ctx);
	    span.setAttribute("class", "yesnofix-uoc");
	    	    
	    var el = document.createTextNode(text);
	    span.appendChild(el);

	    return span;
	},
	
	'render_link': function(link, text, ctx){

	    var anchor = document.createElement("a");
	    anchor.setAttribute("href", link);
	    anchor.setAttribute("target", "_wof");
	    var body = self.render_text(text, ctx);
	    anchor.appendChild(body);

	    return anchor;
	},

	/*
	  .yesnofix-trigger { display:none; padding-left: 1em; }
	  .yesnofix-content:hover .yesnofix-trigger { display:inline; }
	*/

	'render_trigger': function(ctx){

	    var edit = document.createTextNode("📝");	// http://emojipedia.org/memo/

	    var trigger = document.createElement("span");
	    trigger.setAttribute("trigger-id", ctx);
	    trigger.setAttribute("class", "yesnofix-trigger");
	    trigger.appendChild(edit);
	    
	    trigger.onclick = mapzen.whosonfirst.yesnofix.ontrigger;
	    return trigger;
	},

	'render_code': function(text, ctx){
	    
	    var code = document.createElement("code");
	    var body = self.render_text(text, ctx);
	    code.appendChild(body);
	    return code;
	},
	
	'render_timestamp': function(text, ctx){
	    var dt = new Date(parseInt(text) * 1000);
	    return self.render_text(dt.toISOString(), ctx);
	},
	
	'bucket_props': function(props){
	    
	    buckets = {};
	    
	    for (k in props){
		parts = k.split(":", 2);
		
		ns = parts[0];
		pred = parts[1];
		
		if (parts.length != 2){
		    ns = "global";
		    pred = k;
		}
		
		if (! buckets[ns]){
		    buckets[ns] = {};					
		}
		
		buckets[ns][pred] = props[k];
	    }
	    
	    return buckets;
	},
	
	'sort_bucket': function(bucket){
	    
	    var sorted = {};
	    
	    var keys = Object.keys(bucket);
	    keys = keys.sort();
	    
	    var count_keys = keys.length;
	    
	    for (var j=0; j < count_keys; j++){
		var k = keys[j];
		sorted[k] = bucket[k];
	    }
	    
	    return sorted;
	},
	
	'ontrigger': function(e) {
	    
	    var target = e.target;
	    var id = target.getAttribute("trigger-id");
	    var value = target.textContent;

	    if (id == self.current){
		return;
	    }

	    if (self.current){
		self.collapse(self.current);
	    }

	    var enc_id = mapzen.whosonfirst.php.htmlspecialchars(id);
	    var enc_value = mapzen.whosonfirst.php.htmlspecialchars(value);
	    
	    var parent = target.parentElement;
	    
	    if (! parent){
		// PLEASE TO MAKE ERRORS...
		return;
	    }
	    
	    var input = self.render_input(id);
	    parent.appendChild(input);

	    self.current = id;
	},
	
	'render_input': function(id){
	    
	    var input = document.createElement("div");
	    input.setAttribute("class", "yesnofix-assert");
	    input.setAttribute("id", "assert-" + id);
	    
	    var yes = document.createElement("button");
	    yes.setAttribute("class", "yesnofix-assert-yes");
	    yes.setAttribute("data-id", id);
	    yes.setAttribute("data-assertion", status_map['yes']);
	    
	    var no = document.createElement("button");
	    no.setAttribute("class", "yesnofix-assert-no");
	    no.setAttribute("data-id", id);
	    no.setAttribute("data-assertion", status_map['no']);
	    
	    var fix = document.createElement("button");
	    fix.setAttribute("class", "yesnofix-assert-fix");
	    fix.setAttribute("data-id", id);
	    fix.setAttribute("data-assertion", status_map['fix']);
	    
	    var cancel = document.createElement("button");
	    cancel.setAttribute("class", "yesnofix-assert-cancel");
	    cancel.setAttribute("data-id", id);

	    yes.appendChild(document.createTextNode("yes"));
	    no.appendChild(document.createTextNode("no"));
	    fix.appendChild(document.createTextNode("fix"));
	    cancel.appendChild(document.createTextNode("cancel"));
	    
	    yes.onclick = mapzen.whosonfirst.yesnofix.onassert;
	    no.onclick = mapzen.whosonfirst.yesnofix.onassert;
	    fix.onclick = mapzen.whosonfirst.yesnofix.onassert;
	    cancel.onclick = mapzen.whosonfirst.yesnofix.oncancel;

	    input.appendChild(yes);
	    input.appendChild(no);
	    input.appendChild(fix);
	    input.appendChild(cancel);
	    input.appendChild(document.createElement("br"));
	    return input;
	},
	
	'onassert' : function(e){
	    
	    var target = e.target;
	    var id = target.getAttribute("data-id");
	    
	    if (! id){
		return false;
	    }
	    
	    var el = document.getElementById(id);
	    
	    if (! el){
		return false;
	    }
	    
	    var cls = el.getAttribute("class");
	    el.setAttribute("class", cls + " yesnofix-asserted");

	    var path = id;
	    var value = el.textContent;
	    var assertion = target.getAttribute("data-assertion");
	    
	    self.assert(path, value, assertion);
	    
	    self.notify(path + "=" + assertion);

	    self.collapse(id);
	},
	
	'oncancel': function(e){

	    var target = e.target;
	    var id = target.getAttribute("data-id");
	    
	    if (! id){
		return false;
	    }

	    self.collapse(id);
	},

	// this is a bad name... (20160211/thisisaaronland)

	'collapse': function(id){

	    var input = document.getElementById("assert-" + id);
	    
	    var parent = input.parentElement;
	    parent.removeChild(input);

	    self.current = null;
	},

	// note the lack of validation... we're assuming that kind of sanity
	// checking is happening above?
	
	'assert': function(path, value, assertion){
	    var dt = new Date();
	    assertions.push({'path': path, 'value': value, 'assertion': assertion, 'date': dt});
	},
	
	'report': function(){
	    
	    var report = [];
	    var count = assertions.length;
	    
	    for (var i=0; i < count; i++){
		
		var a = assertions[i];
		
		var row = [ a['path'], a['value'], a['assertion'], a['date'].toISOString() ];
		row = row.join(",");
		
		report.push(row);
	    }
	    
	    report = report.join("\n");
	    return report;
	},

	'notify': function(msg, ctx){

	    // https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API#Browser_compatibility

	    var enc_msg = mapzen.whosonfirst.php.htmlspecialchars(msg);

	    if (! window.Notification){
		alert(enc_msg);
		return;
	    }

	    if (Notification.permission == "denied"){
		alert(enc_msg);
		return;
	    }

	    if (Notification.permission != "granted"){

		Notification.requestPermission(function(status){
		    return self.notify(msg);
		});
	    }

	    // TO DO: icons based on ctx (20160217/thisisaaronland)

	    var options = { 'body': enc_msg };

	    var n = new Notification('boundary issues', options);
	    setTimeout(n.close.bind(n), 5000); 
	},
    }
    
    return self;
    
})();

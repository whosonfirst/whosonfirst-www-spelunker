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

    var _exclusions = {
	'text': function(d, ctx){ return null; },
    };

    var _enabled = true;

    var assertions = {};
    var current = null;

    var submit_handler = function(report){
	report = encodeURIComponent(report);
	var data = "data:text/plain;charset=UTF-8," + report;
	window.open(data, '_report');
    };

    var self = {

	'enabled': function(bool){

	    if (typeof(bool) != "undefined"){
		if (bool){
		    _enabled = true;
		} else {
		    _enabled = false;
		}
	    }

	    return _enabled;
	},
	
	'set_submit_handler': function(handler){

	    if (typeof(handler) != "function"){
		self.notify("invalid handler", "error");
		return false;
	    }

	    submit_handler = handler;
	    return true;
	},

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

	'set_custom_exclusions': function(t, e){

	    if (! _exclusions[t]){
		return;
	    }

	    if ((! e) || (typeof(e) != "function")){
		return;
	    }

	    _exclusions[t] = e;
	},

	'get_custom_exclusion': function(t, d, ctx){

	    if (! _exclusions[t]){
		return null;
	    }

	    var exclude =  _exclusions[t];
	    return exclude(d, ctx);
	},
	
	'apply': function(data, target){
	    
	    var el = document.getElementById(target);
	    
		if (! el){
		return false;
	    }
	    
	    var pretty = self.render(data);
	    el.appendChild(pretty);

	    return true;
	},
	
	'render': function(props){
	    
	    var pretty = document.createElement("div");
	    pretty.setAttribute("id", "yesnofix-pretty");

	    var controls = self.render_controls();
	    pretty.appendChild(controls);

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
	
	'render_controls': function(){

	    var report = document.createElement("div");
	    report.setAttribute("id", "yesnofix-report");

	    var buttons = document.createElement("div");
	    buttons.setAttribute("id", "yesnofix-report-buttons");

	    var show = document.createElement("button");
	    show.setAttribute("id", "yesnofix-report-show");
	    show.appendChild(document.createTextNode("show report"));

	    var hide = document.createElement("button");
	    hide.setAttribute("id", "yesnofix-report-hide");
	    hide.appendChild(document.createTextNode("hide report"));

	    var submit = document.createElement("button");
	    submit.setAttribute("id", "yesnofix-report-submit");
	    submit.appendChild(document.createTextNode("submit report"));

	    var br = document.createElement("br");
	    br.setAttribute("clear", "all");

	    buttons.appendChild(show);
	    buttons.appendChild(hide);
	    buttons.appendChild(submit);
	    buttons.appendChild(br);

	    var body = document.createElement("pre");
	    body.setAttribute("id", "yesnofix-report-body");

	    show.onclick = function(){

		var sh = document.getElementById("yesnofix-report-show");
		var hd = document.getElementById("yesnofix-report-hide");
		var sb = document.getElementById("yesnofix-report-submit");
		var bd = document.getElementById("yesnofix-report-body");

		sh.style = "display:none;";
		hd.style = "display:block;";
		bd.style = "display:block;";
		sb.style = "display:block;";
	    };

	    hide.onclick = function(){

		var sh = document.getElementById("yesnofix-report-show");
		var hd = document.getElementById("yesnofix-report-hide");
		var sb = document.getElementById("yesnofix-report-submit");
		var bd = document.getElementById("yesnofix-report-body");

		sh.style = "display:block;";
		hd.style = "display:none;";
		bd.style = "display:none;";
		sb.style = "display:none;";
	    };

	    submit.onclick = function(){
		submit_handler(self.report());
	    };

	    report.appendChild(buttons);
	    report.appendChild(body);

	    return report;
	},

	'render_bucket': function(ns, bucket){
	    
	    var wrapper = document.createElement("div");

		if (ns != '_global_'){

			var header = document.createElement("h3");
			var content = document.createTextNode(ns);
			header.appendChild(content);

			wrapper.appendChild(header);			
		}

	    var sorted = self.sort_bucket(bucket);
	    var body = self.render_data(sorted, ns);
	    
	    wrapper.appendChild(body);
	    
	    return wrapper;
	},
	
	'render_data': function(d, ctx){
	    
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

		var add_trigger = true;

		if (! _enabled){
		    add_trigger = false;
		}

		if (add_trigger){

		    var exclusion = self.get_custom_exclusion('text', d, ctx);

		    if ((exclusion) && (exclusion(d, ctx))){

			var lock = self.render_locked(ctx);
			wrapper.appendChild(lock);   
		    }

		    else {

			var trigger = self.render_trigger(ctx);
			wrapper.appendChild(trigger);
		    }
		}
		
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
		var label = document.createTextNode(self.htmlspecialchars(label_text));
		header.appendChild(label);
		
		var content = document.createElement("td");

		var body = self.render_data(d[k], _ctx);		
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
		return self.render_data(d[0], ctx);
	    }
	    
	    var list = document.createElement("ul");
	    
	    for (var i=0; i < count; i++){
		
		var item = document.createElement("li");
		var body = self.render_data(d[i], ctx + "#" + i);
		
		item.appendChild(body);
		list.appendChild(item);
	    }
	    
	    return list;
	},
	
	'render_text': function(d, ctx){
	    
	    var text = self.htmlspecialchars(d);
	    
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
	  .yesnofix-trigger { display:none; padding-right: 1em; }
	  .yesnofix-content:hover .yesnofix-trigger { display:inline; }
	*/

	'render_trigger': function(ctx){

	    var edit = document.createTextNode("📝");	// http://emojipedia.org/memo/

	    var trigger = document.createElement("span");
	    trigger.setAttribute("trigger-id", ctx);
	    trigger.setAttribute("class", "yesnofix-trigger");
	    trigger.setAttribute("title", "assert an opinion about this attribute");

	    trigger.appendChild(edit);
	    
	    trigger.onclick = mapzen.whosonfirst.yesnofix.ontrigger;
	    return trigger;
	},

	/*
	  .yesnofix-locked { display:none; padding-right: 1em; }
	  .yesnofix-content:hover .yesnofix-locked { display:inline; }
	*/

	'render_locked': function(ctx){
	    
	    var icon = document.createTextNode("🔒");	// http://emojipedia.org/memo/

	    var locked = document.createElement("span");
	    locked.setAttribute("class", "yesnofix-locked");
	    locked.setAttribute("title", "this attribute is locked");

	    locked.appendChild(icon);
	    
	    return locked;
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
		    ns = "_global_";
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

	    var enc_id = self.htmlspecialchars(id);
	    var enc_value = self.htmlspecialchars(value);
	    
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
	    yes.setAttribute("title", "yes, this value is correct");

	    var no = document.createElement("button");
	    no.setAttribute("class", "yesnofix-assert-no");
	    no.setAttribute("data-id", id);
	    no.setAttribute("data-assertion", status_map['no']);
	    no.setAttribute("title", "no, this value is incorrect");
	    
	    var fix = document.createElement("button");
	    fix.setAttribute("class", "yesnofix-assert-fix");
	    fix.setAttribute("data-id", id);
	    fix.setAttribute("data-assertion", status_map['fix']);
	    fix.setAttribute("title", "this value is somewhere between weird data and kind-of-correct data, but still needs some help");
	    
	    var cancel = document.createElement("button");
	    cancel.setAttribute("class", "yesnofix-assert-cancel");
	    cancel.setAttribute("data-id", id);
	    cancel.setAttribute("title", "actually, never mind");

	    var about = document.createElement("button");
	    about.setAttribute("class", "yesnofix-assert-about");
	    about.setAttribute("title", "wait... what's going? what is this?");

	    yes.appendChild(document.createTextNode("yes"));
	    no.appendChild(document.createTextNode("no"));
	    fix.appendChild(document.createTextNode("fix"));
	    cancel.appendChild(document.createTextNode("cancel"));
	    about.appendChild(document.createTextNode("?"));
	    
	    yes.onclick = mapzen.whosonfirst.yesnofix.onassert;
	    no.onclick = mapzen.whosonfirst.yesnofix.onassert;
	    fix.onclick = mapzen.whosonfirst.yesnofix.onassert;
	    cancel.onclick = mapzen.whosonfirst.yesnofix.oncancel;
	    about.onclick = mapzen.whosonfirst.yesnofix.onabout;

	    input.appendChild(yes);
	    input.appendChild(no);
	    input.appendChild(fix);
	    input.appendChild(cancel);
	    input.appendChild(about);

	    input.appendChild(document.createElement("br"));
	    return input;
	},
	
	'onabout': function(){

	    var about = document.createElement("div");
	    about.setAttribute("id", "yesnofix-about");

	    var text = document.createElement("div");
	    text.setAttribute("id", "yesnofix-about-text");

	    var head = document.createElement("h2");
	    head.appendChild(document.createTextNode("What is Yes No Fix ?"));

	    var intro_sentences = [
		"Yes No Fix allows you to fact-check and offer an opinion about the contents of this web page.",
		"Those opinions can then be bundled up as a report and sent to its authors.",
		"When you say:"
	    ];

	    var intro_text = intro_sentences.join(" ");

	    var intro = document.createElement("p");
	    intro.appendChild(document.createTextNode(intro_text));

	    var options = document.createElement("ul");

	    var yes = document.createElement("li");
	    yes.appendChild(document.createTextNode("Yes, this means this data is correct"));

	    var no = document.createElement("li");
	    no.appendChild(document.createTextNode("No, this means this data is incorrect and should be removed"));

	    var fix = document.createElement("li");
	    fix.appendChild(document.createTextNode("Fix, this means this data is not entirely wrong but needs to be corrected"));

	    options.appendChild(yes);
	    options.appendChild(no);
	    options.appendChild(fix);

	    var outro_sentences = [
		"When you're done yes-no-fix-ing things click the \"show report\" button to review your work and submit your report.",
		"The details of where a report is sent and how it is processed will vary from website to website."
	    ];

	    var outro_text = outro_sentences.join(" ");

	    var outro = document.createElement("p");
	    outro.appendChild(document.createTextNode(outro_text));

	    text.appendChild(head);
	    text.appendChild(intro);
	    text.appendChild(options);
	    text.appendChild(outro);

	    var close = document.createElement("div");
	    close.setAttribute("id", "yesnofix-about-close");

	    var button = document.createElement("button");
	    button.setAttribute("id", "yesnofix-about-close-button");
	    button.appendChild(document.createTextNode("okay!"));

	    close.appendChild(button);

	    about.appendChild(text);
	    about.appendChild(close);

	    button.onclick = function(){
		var about = document.getElementById("yesnofix-about");
		var parent = about.parentElement;
		parent.removeChild(about);
	    };

	    var body = document.body;
	    body.insertBefore(about, body.firstChild);

	    return false;
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
	    
	    var path = id;
	    var value = el.textContent;
	    var assertion = target.getAttribute("data-assertion");

	    var str_assertion = "";

	    for (k in status_map){

		if (assertion == status_map[k]){
		    str_assertion = k;
		    break;
		}
	    }

	    self.assert(path, value, assertion);
	    
	    self.notify(path + "=" + str_assertion);

	    self.collapse(id);

	    var body = document.getElementById("yesnofix-report-body");
	    body.innerHTML = self.report();

	    if (body.style.display != "block"){
		var show = document.getElementById("yesnofix-report-show");
		show.style.display = "block";
	    }

	    var cls = el.getAttribute("class");
	    cls = cls.split(" ");
	    var count = cls.length;

	    var new_cls = [];

	    for (var i=0; i < count; i++){
		if (cls[i].match(/^yesnofix-asserted/)){
		    continue;
		}

		new_cls.push(cls[i]);
	    }

	    new_cls.push("yesnofix-asserted");
	    new_cls.push("yesnofix-asserted-" + str_assertion);
	    new_cls = new_cls.join(" ");

	    console.log(new_cls);
	    el.setAttribute("class", new_cls);

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
	    assertions[path] = {'path': path, 'value': value, 'assertion': assertion, 'date': dt};
	},
	
	'report': function(){
	    
	    var report = [ "path,value,assertion,date" ];
	    var count = assertions.length;
	    
	    for (path in assertions){
		
		var a = assertions[path];
		
		var row = [ a['path'], a['value'], a['assertion'], a['date'].toISOString() ];
		row = row.join(",");
		
		report.push(row);
	    }
	    
	    report = report.join("\n");
	    return report;
	},

	'notify': function(msg, ctx){

	    // it turns out this stuff is super annoying...
	    // (20160321/thisisaaronland)

	    return;

	    // https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API#Browser_compatibility

	    var enc_msg = self.htmlspecialchars(msg);

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

	'htmlspecialchars': function(string, quote_style, charset, double_encode){
	    //       discuss at: http://phpjs.org/functions/htmlspecialchars/
	    //      original by: Mirek Slugen
	    //      improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	    //      bugfixed by: Nathan
	    //      bugfixed by: Arno
	    //      bugfixed by: Brett Zamir (http://brett-zamir.me)
	    //      bugfixed by: Brett Zamir (http://brett-zamir.me)
	    //       revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	    //         input by: Ratheous
	    //         input by: Mailfaker (http://www.weedem.fr/)
	    //         input by: felix
	    // reimplemented by: Brett Zamir (http://brett-zamir.me)
	    //             note: charset argument not supported
	    //        example 1: htmlspecialchars("<a href='test'>Test</a>", 'ENT_QUOTES');
	    //        returns 1: '&lt;a href=&#039;test&#039;&gt;Test&lt;/a&gt;'
	    //        example 2: htmlspecialchars("ab\"c'd", ['ENT_NOQUOTES', 'ENT_QUOTES']);
	    //        returns 2: 'ab"c&#039;d'
	    //        example 3: htmlspecialchars('my "&entity;" is still here', null, null, false);
	    //        returns 3: 'my &quot;&entity;&quot; is still here'
	    
	    var optTemp = 0,
	    i = 0,
	    noquotes = false;
	    if (typeof quote_style === 'undefined' || quote_style === null) {
		quote_style = 2;
	    }
	    string = string.toString();
	    if (double_encode !== false) {
		// Put this first to avoid double-encoding
		string = string.replace(/&/g, '&amp;');
	    }
	    string = string.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
	    
	    var OPTS = {
		'ENT_NOQUOTES'          : 0,
		'ENT_HTML_QUOTE_SINGLE' : 1,
		'ENT_HTML_QUOTE_DOUBLE' : 2,
		'ENT_COMPAT'            : 2,
		'ENT_QUOTES'            : 3,
		'ENT_IGNORE'            : 4
	    };
	    if (quote_style === 0) {
		noquotes = true;
	    }
	    if (typeof quote_style !== 'number') {
		// Allow for a single string or an array of string flags
		quote_style = [].concat(quote_style);
		for (i = 0; i < quote_style.length; i++) {
		    // Resolve string input to bitwise e.g. 'ENT_IGNORE' becomes 4
		    if (OPTS[quote_style[i]] === 0) {
			noquotes = true;
		    } else if (OPTS[quote_style[i]]) {
			optTemp = optTemp | OPTS[quote_style[i]];
		    }
		}
		quote_style = optTemp;
	    }
	    if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
		string = string.replace(/'/g, '&#039;');
	    }
	    if (!noquotes) {
		string = string.replace(/"/g, '&quot;');
	    }
	    
	    return string;
	}
	
    }
    
    return self;
    
})();

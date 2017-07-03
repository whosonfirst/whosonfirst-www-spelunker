# whosonfirst-www-spelunker

A simple Flask-based spelunker for poking around Who's On First data stored in an [Elasticsearch](https://github.com/mapzen/py-mapzen-whosonfirst-search)) document index.

The spelunker is very much a tool to help work through what the public-facing resource (spelunker) _should_ as it is to help us (Mapzen) visualize and sanity check the
data. The spelunker does many things but it does not do everything yet, or in some cases ever.

## Installation

The Who's On First spelunker is primarily designed for running on a Ubuntu Linux distribution. It's not designed _for_ a Ubuntu distribution so adapting it to another platform shouldn't be difficult but that is not work we've done yet.

There is also a handy [vagrant-whosonfirst-www-spelunker](https://github.com/whosonfirst/vagrant-whosonfirst-www-spelunker) Vagrant package for building all the software dependencies and running a copy of the spelunker on your local machine. That's probably a good (better) place to start if you just want to poke around a local copy of the Who's On First data.

If you're feeling confident or dangerous or both there is a handy `Makefile` included that will attempt to install and configure everything you need to fire up a copy of the spelunker over an encrypted connection at `https://localhost/`. Like this:

```
make build-local
```

Note that default build scripts will create a self-signed TLS certificate so you should expect your browser to display a security warning. The `build` target is actually just a wrapper around three other targets: `setup-local`, `data` and `index` which are all (hopefully) self-explanatory but the gorey details follow below.

### Software

Currently all the packaging and dependencies target a modern Ubuntu Linux distribution. There is little (nothing) that is really Ubuntu-specific but in the interest of getting things done that's the focus right now. All of scripts to install the spelunker and its dependencies are found in the `ubuntu` folder so you can run them each atomically if you need to. There are also one `Makefile` target for installing all the software and indexing the data. Like this:

```
make setup-local
```

These are separate targets because depending on the machine you're using indexing the data can take quite a long time. _Please be sure to read the section on data (below) for charging ahead and invoking the Makefile or installing software._

### Data sources

The convention is to store all Who's On First (WOF) data in a root `/usr/local/mapzen/whosonfirst-data` directory. That is however just a convention. For the purposes of the spelunker we care about the location of WOF data in three places:

* The indexing scripts for storing WOF data in one or more database (like Elasticsearch) which is discussed in more detail below.
* The config file for the webserver (nginx) so that it knows how to resolve requests for a WOF document.
* The `make-data.sh` script which will fetch WOF data "bundles" from the Internet and store them locally, as part of the `build-local` Makefile target.

The `ubuntu/make-data.sh` script is a small tool that will download bundled versions of [common placetypes in WOF]() and store them in a sub-directory of _this repository_ called `data`. You can override the destination folder by passing in a path (to a folder) as the first argument to the script. For example:

```
$> ubuntu/make-data.sh /path/to/some-other/whosonfirst-data/folder
```

That's just the default though. Another option is to download one or more [Who's On First data repositories](https://github.com/whosonfirst-data) to a location of your choosing and to index and serve them using the [wof-roundhouse-repod]() tool. For example:

```
./bin/wof-roundhouse-repod /usr/local/mapzen/whosonfirst-data*
2017/07/03 15:50:47 start indexing whosonfirst-data-venue-us-ca at 2017-07-03 15:50:47.808249449 +0000 UTC
2017/07/03 15:50:47 start indexing whosonfirst-data at 2017-07-03 15:50:47.809042249 +0000 UTC
2017/07/03 15:50:47 start indexing whosonfirst-data-venue-ca at 2017-07-03 15:50:47.810867862 +0000 UTC
2017/07/03 15:51:27 time to index whosonfirst-data-venue-ca: 39.240279572s
2017/07/03 15:51:32 time to index whosonfirst-data: 44.511392089s
2017/07/03 15:51:51 time to index whosonfirst-data-venue-us-ca: 1m3.898184345s
2017/07/03 15:51:51 time to index all: 1m3.898692508s
```

`wof-roundhouse-repod` will index which repository a given record is and read the corresponding file when requested. You might use `wof-roundhouse-repod` if you are using the Spelunker on a local [Vagrant machine]() where you have already downloaded WOF data to the host machine (aka "your laptop") and are mounting those repositories as individual shared volumes.

The default `nginx` config defines a single `/data/` location but under the hood it is checking a number of possible sources a data file. First it checks the local (to this repository) `data` directory. If the requested file isn't found it then tries the same request against a `wof-roundhouse-repod` endpoint. Finally, if that doesn't work it asks `https://whosonfirst.mapzen.com/data` for the file. This is what that looks like, from nginx's perspective:


```
	location /data/ {
		sendfile           on;
		sendfile_max_chunk 1m;
		tcp_nopush on;

		try_files $uri @data_local;
        }

	location @data_local {

		root /usr/local/mapzen/whosonfirst-www-spelunker/data;

	    	add_header 'Access-Control-Allow-Origin' '*';
            	add_header 'Access-Control-Allow-Methods' 'GET';

		proxy_intercept_errors on;
		recursive_error_pages on;
		error_page 404 = @data_repod;
        }

	location @data_repod {

		proxy_set_header       Authorization '';
		proxy_hide_header      Set-Cookie;
		proxy_ignore_headers   "Set-Cookie";

	    	add_header 'Access-Control-Allow-Origin' '*';
            	add_header 'Access-Control-Allow-Methods' 'GET';

		proxy_pass http://127.0.0.1:8080$uri;

		proxy_intercept_errors on;
		recursive_error_pages on;
		error_page 404 = @data_mapzen;
        }

	location @data_mapzen {

		proxy_set_header       Authorization '';
		proxy_hide_header      Set-Cookie;
		proxy_ignore_headers   "Set-Cookie";

	    	add_header 'Access-Control-Allow-Origin' '*';
            	add_header 'Access-Control-Allow-Methods' 'GET';

		resolver 8.8.8.8;
		proxy_pass https://whosonfirst.mapzen.com$uri;
	}
```

You should feel free to adjust accordingly as your needs dictate.

Finally the JavaScript code that runs in the Spelunker is told where to look for data files in the `mapzen.whosonfirst.config.js` file, like this:


```
var endpoint = document.body.getAttribute("data-wof-data-endpoint");

if (endpoint == ""){
	var root = location.protocol + "//" + location.host;
	endpoint = root + "/data/";
}	

mapzen.whosonfirst.uri.endpoint(endpoint);
```

The default data endpoint is the current host + `/data/` but you can override this in your `whosonfirst-www-spelunker-flask.cfg` config file, like this:

```
[spelunker]
data_root=https://whosonfirst.mapzen.com/data/
```

When the Spelunker starts up it will read that value and assign it to the `data-wof-data-endpoint` attribute that will in turn be read by the JavaScript code above. Remember: The JavaScript code doesn't know (or care) what or where the `nginx` server is looking for files. It assumes there is a single endpoint that will take care of all the details.

## Indexing data

```
wof-es-index -s /usr/local/mapzen/whosonfirst-data/data -b
```

## See also

* https://github.com/whosonfirst/vagrant-whosonfirst-www-spelunker
* https://github.com/whosonfirst/vagrant-whosonfirst-www-spelunker
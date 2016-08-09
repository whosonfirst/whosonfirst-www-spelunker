upgrade:
	sudo apt-get update
	sudo apt-get upgrade

build-local:	setup-local data index

setup-app:
	ubuntu/setup-ubuntu.sh
	ubuntu/setup-py-mapzen.sh
	ubuntu/setup-spelunker.sh
	ubuntu/setup-gunicorn.sh

setup-nginx:
	ubuntu/setup-certified.sh
	sudo ubuntu/setup-certified-ca.sh
	sudo ubuntu/setup-certified-certs.sh
	ubuntu/setup-nginx.sh $(data)

setup-local: setup-app setup-nginx
	ubuntu/setup-elasticsearch.sh
	# ubuntu/setup-postgis.sh

data:
	ubuntu/setup-data.sh $(data)

index:
	ubuntu/setup-postgis-index.sh $(data)
	ubuntu/setup-elasticsearch-index.sh $(data)

mapzen: styleguide tangram refill yesnofix crosshairs

pyzen:
	./ubuntu/setup-py-mapzen.sh

yesnofix:
	if test -e www/static/javascript/mapzen.whosonfirst.yesnofix.js; then cp www/static/javascript/mapzen.whosonfirst.yesnofix.js www/static/javascript/mapzen.whosonfirst.yesnofix.js.bak; fi
	curl -s -o www/static/javascript/mapzen.whosonfirst.yesnofix.js https://raw.githubusercontent.com/whosonfirst/js-mapzen-whosonfirst-yesnofix/master/src/mapzen.whosonfirst.yesnofix.js

styleguide:
	if test -e www/static/css/mapzen.styleguide.css; then cp www/static/css/mapzen.styleguide.css www/static/css/mapzen.styleguide.css.bak; fi
	curl -s -o www/static/css/mapzen.styleguide.css https://mapzen.com/common/styleguide/styles/styleguide.css

tangram:
	if test -e www/static/javascript/tangram.js; then cp www/static/javascript/tangram.js www/static/javascript/tangram.js.bak; fi
	curl -s -o www/static/javascript/tangram.js https://mapzen.com/tangram/tangram.debug.js
	if test -e www/static/javascript/tangram.min.js; then cp www/static/javascript/tangram.min.js www/static/javascript/tangram.min.js.bak; fi
	curl -s -o www/static/javascript/tangram.min.js https://mapzen.com/tangram/tangram.min.js

refill:
	if test -e www/static/tangram/refill.yaml; then cp www/static/tangram/refill.yaml www/static/tangram/refill.yaml.bak; fi
	curl -s -o www/static/tangram/refill.yaml https://raw.githubusercontent.com/tangrams/refill-style/gh-pages/refill-style.yaml

	if test -e www/static/tangram/images/poi_icons_18@2x.png; then cp www/static/tangram/images/poi_icons_18@2x.png www/static/tangram/images/poi_icons_18@2x.png.bak; fi
	curl -s -o www/static/tangram/images/poi_icons_18@2x.png https://raw.githubusercontent.com/tangrams/refill-style/gh-pages/images/poi_icons_18%402x.png

	if test -e www/static/tangram/images/building-grid.gif; then cp www/static/tangram/images/building-grid.gif www/static/tangram/images/building-grid.gif.bak; fi
	curl -s -o www/static/tangram/images/building-grid.gif https://raw.githubusercontent.com/tangrams/refill-style/gh-pages/images/building-grid.gif

js: js-dependencies js-app

js-dependencies:
	cat www/static/javascript/jquery-3.1.0.min.js www/static/javascript/bootstrap.min.js www/static/javascript/localforage.min.js www/static/javascript/leaflet.min.js www/static/javascript/leaflet.label.min.js www/static/javascript/FileSaver.min.js www/static/javascript/tangram.min.js > www/static/javascript/mapzen.whosonfirst.spelunker.dependencies.js
	echo "" >> www/static/javascript/mapzen.whosonfirst.spelunker.dependencies.js
	echo "// last bundled at "`date "+%Y-%m-%dT%H:%M:%S %Z"` >> www/static/javascript/mapzen.whosonfirst.spelunker.dependencies.js

js-app:
	cat www/static/javascript/mapzen.whosonfirst.log.js www/static/javascript/mapzen.whosonfirst.php.js www/static/javascript/mapzen.whosonfirst.placetypes.js www/static/javascript/mapzen.whosonfirst.data.js www/static/javascript/mapzen.whosonfirst.geojson.js www/static/javascript/mapzen.whosonfirst.leaflet.js www/static/javascript/mapzen.whosonfirst.leaflet.styles.js www/static/javascript/mapzen.whosonfirst.leaflet.handlers.js www/static/javascript/mapzen.whosonfirst.leaflet.tangram.js www/static/javascript/mapzen.whosonfirst.net.js www/static/javascript/mapzen.whosonfirst.enmapify.js www/static/javascript/mapzen.whosonfirst.properties.js www/static/javascript/mapzen.whosonfirst.yesnofix.js www/static/javascript/mapzen.whosonfirst.spelunker.js > www/static/javascript/mapzen.whosonfirst.spelunker.app.js
	echo "" >> www/static/javascript/mapzen.whosonfirst.spelunker.app.js
	echo "// last bundled at "`date "+%Y-%m-%dT%H:%M:%S %Z"` >> www/static/javascript/mapzen.whosonfirst.spelunker.app.js

es-schema:
	if test -e schema/elasticsearch/mappings.spelunker.json; then cp schema/elasticsearch/mappings.spelunker.json schema/elasticsearch/mappings.spelunker.json.bak; fi
	curl -s -o schema/elasticsearch/mappings.spelunker.json https://raw.githubusercontent.com/whosonfirst/es-whosonfirst-schema/master/schema/mappings.spelunker.json

es-reload:
	curl -s -XDELETE 'http://$(host):9200/whosonfirst' | python -mjson.tool
	cat "schema/elasticsearch/mappings.spelunker.json" | curl -s -XPUT 'http://$(host):9200/whosonfirst' -d @- | python -mjson.tool

es-index:
	sudo -u www-data ./ubuntu/setup-elasticsearch-index.sh $(data)

localforage:
	curl -s -o www/static/javascript/localforage.js https://raw.githubusercontent.com/mozilla/localForage/master/dist/localforage.js
	curl -s -o www/static/javascript/localforage.min.js https://raw.githubusercontent.com/mozilla/localForage/master/dist/localforage.min.js

crosshairs:
	curl -s -o www/static/javascript/slippymap.crosshairs.js https://raw.githubusercontent.com/whosonfirst/js-slippymap-crosshairs/master/src/slippymap.crosshairs.js

docker-build:
	docker build -t wof-spelunker .

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
	ubuntu/setup-elasticsearch-schema.sh

data:
	ubuntu/setup-data.sh $(data)

index:
	ubuntu/setup-elasticsearch-index.sh $(data)

mapzen: styleguide tangram refill yesnofix crosshairs wof-js wof-css

yesnofix:
	curl -s -o www/static/javascript/mapzen.whosonfirst.yesnofix.js https://raw.githubusercontent.com/whosonfirst/js-mapzen-whosonfirst-yesnofix/master/src/mapzen.whosonfirst.yesnofix.js

styleguide:
	curl -s -o www/static/css/mapzen.styleguide.css https://mapzen.com/common/styleguide/styles/styleguide.css

geopoint:
	curl -s -o www/static/javascript/geopoint.js https://raw.githubusercontent.com/davidwood/node-geopoint/master/geopoint.js

tangram:
	curl -s -o www/static/javascript/tangram.js https://mapzen.com/tangram/tangram.debug.js
	curl -s -o www/static/javascript/tangram.min.js https://mapzen.com/tangram/tangram.min.js

refill:
	curl -s -o www/static/tangram/refill.yaml https://raw.githubusercontent.com/tangrams/refill-style/gh-pages/refill-style.yaml
	curl -s -o www/static/tangram/themes/color-black.yaml https://raw.githubusercontent.com/tangrams/refill-style/gh-pages/themes/color-black.yaml
	curl -s -o www/static/tangram/themes/label-5.yaml https://raw.githubusercontent.com/tangrams/refill-style/gh-pages/themes/label-5.yaml
	curl -s -o www/static/tangram/themes/refill-icons.yaml https://raw.githubusercontent.com/tangrams/refill-style/gh-pages/themes/refill-icons.yaml
	curl -s -o www/static/tangram/themes/images/refill@2x.png https://raw.githubusercontent.com/tangrams/refill-style/gh-pages/themes/images/refill%402x.png
	curl -s -o www/static/tangram/images/building-grid.gif https://raw.githubusercontent.com/tangrams/refill-style/gh-pages/images/building-grid.gif

wof-fonts:
	curl -s -o www/static/fonts/Poppins-Light.ttf https://raw.githubusercontent.com/whosonfirst/whosonfirst-www/master/www/fonts/Poppins-Light.ttf
	curl -s -o www/static/fonts/Poppins-Medium.ttf https://raw.githubusercontent.com/whosonfirst/whosonfirst-www/master/www/fonts/Poppins-Medium.ttf
	curl -s -o www/static/fonts/Poppins-SemiBold.ttf https://raw.githubusercontent.com/whosonfirst/whosonfirst-www/master/www/fonts/Poppins-SemiBold.ttf
	curl -s -o www/static/fonts/Roboto-Light.ttf https://raw.githubusercontent.com/whosonfirst/whosonfirst-www/master/www/fonts/Roboto-Light.ttf
	curl -s -o www/static/fonts/Roboto-LightItalic.ttf https://raw.githubusercontent.com/whosonfirst/whosonfirst-www/master/www/fonts/Roboto-LightItalic.ttf
	curl -s -o www/static/fonts/Roboto-Regular.ttf https://raw.githubusercontent.com/whosonfirst/whosonfirst-www/master/www/fonts/Roboto-Regular.ttf
	curl -s -o www/static/fonts/Roboto-Mono-Light.ttf https://raw.githubusercontent.com/whosonfirst/whosonfirst-www/master/www/fonts/Roboto-Mono-Light.ttf
	curl -s -o www/static/fonts/glyphicons-halflings-regular.eot https://raw.githubusercontent.com/whosonfirst/whosonfirst-www/master/www/fonts/glyphicons-halflings-regular.eot
	curl -s -o www/static/fonts/glyphicons-halflings-regular.svg https://raw.githubusercontent.com/whosonfirst/whosonfirst-www/master/www/fonts/glyphicons-halflings-regular.svg
	curl -s -o www/static/fonts/glyphicons-halflings-regular.ttf https://raw.githubusercontent.com/whosonfirst/whosonfirst-www/master/www/fonts/glyphicons-halflings-regular.ttf
	curl -s -o www/static/fonts/glyphicons-halflings-regular.woff https://raw.githubusercontent.com/whosonfirst/whosonfirst-www/master/www/fonts/glyphicons-halflings-regular.woff

wof-css:	wof-fonts
	curl -s -o www/static/css/mapzen.whosonfirst.css https://raw.githubusercontent.com/whosonfirst/whosonfirst-www/master/www/css/mapzen.whosonfirst.css
	curl -s -o www/static/css/mapzen.whosonfirst.chrome.css https://raw.githubusercontent.com/whosonfirst/css-mapzen-whosonfirst/master/css/mapzen.whosonfirst.chrome.css

wof-js:
	curl -s -o www/static/javascript/mapzen.whosonfirst.enmapify.js https://raw.githubusercontent.com/whosonfirst/js-mapzen-whosonfirst/master/src/mapzen.whosonfirst.enmapify.js
	curl -s -o www/static/javascript/mapzen.whosonfirst.geojson.js https://raw.githubusercontent.com/whosonfirst/js-mapzen-whosonfirst/master/src/mapzen.whosonfirst.geojson.js
	curl -s -o www/static/javascript/mapzen.whosonfirst.log.js https://raw.githubusercontent.com/whosonfirst/js-mapzen-whosonfirst/master/src/mapzen.whosonfirst.log.js
	curl -s -o www/static/javascript/mapzen.whosonfirst.namify.js https://raw.githubusercontent.com/whosonfirst/js-mapzen-whosonfirst/master/src/mapzen.whosonfirst.namify.js
	curl -s -o www/static/javascript/mapzen.whosonfirst.net.js https://raw.githubusercontent.com/whosonfirst/js-mapzen-whosonfirst/master/src/mapzen.whosonfirst.net.js
	curl -s -o www/static/javascript/mapzen.whosonfirst.php.js https://raw.githubusercontent.com/whosonfirst/js-mapzen-whosonfirst/master/src/mapzen.whosonfirst.php.js
	curl -s -o www/static/javascript/mapzen.whosonfirst.placetypes.js https://raw.githubusercontent.com/whosonfirst/js-mapzen-whosonfirst/master/src/mapzen.whosonfirst.placetypes.js
	curl -s -o www/static/javascript/mapzen.whosonfirst.uri.js https://raw.githubusercontent.com/whosonfirst/js-mapzen-whosonfirst/master/src/mapzen.whosonfirst.uri.js
	curl -s -o www/static/javascript/mapzen.whosonfirst.chrome.js https://raw.githubusercontent.com/whosonfirst/js-mapzen-whosonfirst/master/src/mapzen.whosonfirst.chrome.js
	curl -s -o www/static/javascript/mapzen.whosonfirst.chrome.init.js https://raw.githubusercontent.com/whosonfirst/js-mapzen-whosonfirst/master/src/mapzen.whosonfirst.chrome.init.js

js: js-dependencies js-app

js-dependencies:
	cat www/static/javascript/jquery-3.1.0.min.js www/static/javascript/bootstrap.min.js www/static/javascript/localforage.min.js www/static/javascript/leaflet.min.js www/static/javascript/leaflet.label.min.js www/static/javascript/FileSaver.min.js www/static/javascript/tangram.min.js > www/static/javascript/mapzen.whosonfirst.spelunker.dependencies.js
	echo "" >> www/static/javascript/mapzen.whosonfirst.spelunker.dependencies.js
	echo "// last bundled at "`date "+%Y-%m-%dT%H:%M:%S %Z"` >> www/static/javascript/mapzen.whosonfirst.spelunker.dependencies.js

js-app:
	cat www/static/javascript/mapzen.whosonfirst.log.js www/static/javascript/mapzen.whosonfirst.php.js www/static/javascript/mapzen.whosonfirst.placetypes.js www/static/javascript/mapzen.whosonfirst.uri.js www/static/javascript/mapzen.whosonfirst.geojson.js www/static/javascript/mapzen.whosonfirst.leaflet.js www/static/javascript/mapzen.whosonfirst.leaflet.styles.js www/static/javascript/mapzen.whosonfirst.leaflet.handlers.js www/static/javascript/mapzen.whosonfirst.leaflet.tangram.js www/static/javascript/mapzen.whosonfirst.net.js www/static/javascript/mapzen.whosonfirst.enmapify.js www/static/javascript/mapzen.whosonfirst.properties.js www/static/javascript/mapzen.whosonfirst.yesnofix.js www/static/javascript/mapzen.whosonfirst.spelunker.js www/static/javascript/mapzen.whosonfirst.chrome.js www/static/javascript/mapzen.whosonfirst.chrome.init.js > www/static/javascript/mapzen.whosonfirst.spelunker.app.js
	echo "" >> www/static/javascript/mapzen.whosonfirst.spelunker.app.js
	echo "// last bundled at "`date "+%Y-%m-%dT%H:%M:%S %Z"` >> www/static/javascript/mapzen.whosonfirst.spelunker.app.js

es:
	curl -s -o elasticsearch/schema/m
appings.spelunker.json https://raw.githubusercontent.com/whosonfirst/es-whosonfirst-schema/master/schema/2.4/mappings.spelunker.json
	curl -s -o elasticsearch/synonyms/cldr-emoji-annotation-synonyms-en.txt https://raw.githubusercontent.com/whosonfirst/es-whosonfirst-schema/master/synonyms/cldr-emoji-annotation-synonyms-en.txt

es-reload:
	curl -s -XDELETE 'http://$(host):9200/spelunker' | python -mjson.tool
	cat "schema/elasticsearch/mappings.spelunker.json" | curl -s -XPUT http://$(host):9200/spelunker -d @- | python -mjson.tool

es-index:
	sudo -u www-data ./ubuntu/setup-elasticsearch-index.sh $(data)

localforage:
	curl -s -o www/static/javascript/localforage.js https://raw.githubusercontent.com/mozilla/localForage/master/dist/localforage.js
	curl -s -o www/static/javascript/localforage.min.js https://raw.githubusercontent.com/mozilla/localForage/master/dist/localforage.min.js

crosshairs:
	curl -s -o www/static/javascript/slippymap.crosshairs.js https://raw.githubusercontent.com/whosonfirst/js-slippymap-crosshairs/master/src/slippymap.crosshairs.js

dev-to-mz:
	git checkout master
	git pull origin dev
	git push origin master
	git checkout mapzen
	git pull origin master
	git push origin mapzen
	git checkout master
	git checkout dev

d2mz: dev-to-mz

simple_properties:
	curl -s -o www/static/meta/simple_properties.json https://raw.githubusercontent.com/whosonfirst/whosonfirst-properties/master/aliases/simple_properties.json

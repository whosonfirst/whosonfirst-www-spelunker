setup:
	ubuntu/setup-ubuntu.sh
	ubuntu/setup-py-mapzen.sh
	ubuntu/setup-certified.sh
	sudo ubuntu/setup-certified-ca.sh
	sudo ubuntu/setup-certified-certs.sh
	ubuntu/setup-gunicorn.sh
	ubuntu/setup-nginx.sh
	
index:
	ubuntu/setup-elasticsearch-index.sh

tangram:
	if test -e www/static/javascript/tangram.js; then cp www/static/javascript/tangram.js www/static/javascript/tangram.js.bak; fi
	curl -s -o www/static/javascript/tangram.js https://mapzen.com/tangram/tangram.debug.js
	if test -e www/static/javascript/tangram.min.js; then cp www/static/javascript/tangram.min.js www/static/javascript/tangram.min.js.bak; fi
	curl -s -o www/static/javascript/tangram.min.js https://mapzen.com/tangram/tangram.min.js

js: js-dependencies js-app

js-dependencies:
	cat www/static/javascript/leaflet.min.js www/static/javascript/leaflet.label.min.js www/static/javascript/FileSaver.min.js www/static/javascript/tangram.min.js > www/static/javascript/mapzen.whosonfirst.spelunker.dependencies.js
	echo "" >> www/static/javascript/mapzen.whosonfirst.spelunker.dependencies.js
	echo "// last bundled at "`date "+%Y-%m-%dT%H:%M:%S %Z"` >> www/static/javascript/mapzen.whosonfirst.spelunker.dependencies.js

js-app:
	cat www/static/javascript/mapzen.whosonfirst.log.js www/static/javascript/mapzen.whosonfirst.php.js www/static/javascript/mapzen.whosonfirst.placetypes.js www/static/javascript/mapzen.whosonfirst.data.js www/static/javascript/mapzen.whosonfirst.geojson.js www/static/javascript/mapzen.whosonfirst.leaflet.js www/static/javascript/mapzen.whosonfirst.leaflet.styles.js www/static/javascript/mapzen.whosonfirst.leaflet.handlers.js www/static/javascript/mapzen.whosonfirst.leaflet.tangram.js www/static/javascript/mapzen.whosonfirst.net.js www/static/javascript/mapzen.whosonfirst.enmapify.js www/static/javascript/mapzen.whosonfirst.spelunker.js > www/static/javascript/mapzen.whosonfirst.spelunker.app.js
	echo "" >> www/static/javascript/mapzen.whosonfirst.spelunker.app.js
	echo "// last bundled at "`date "+%Y-%m-%dT%H:%M:%S %Z"` >> www/static/javascript/mapzen.whosonfirst.spelunker.app.js

refill:
	if test -f www/static/tangram/refill.yaml; then cp www/static/tangram/refill.yaml www/static/tangram/refill.yaml.old; fi
	curl -o www/static/tangram/refill.yaml https://raw.githubusercontent.com/tangrams/refill/gh-pages/refill.yaml
	if test -f www/static/tangram/images/poi_icons_18@2x.png; then cp www/static/tangram/images/poi_icons_18@2x.png www/static/tangram/images/poi_icons_18@2x.png.old; fi
	curl -o www/static/tangram/images/poi_icons_18@2x.png https://raw.githubusercontent.com/tangrams/refill/gh-pages/images/poi_icons_18%402x.png

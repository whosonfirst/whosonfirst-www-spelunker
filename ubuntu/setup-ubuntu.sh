#!/bin/sh

sudo apt-get update
sudo apt-get upgrade -y

sudo apt-get install -y git tcsh emacs24-nox htop sysstat ufw fail2ban unattended-upgrades python-setuptools unzip
sudo apt-get install -y gdal-bin
sudo apt-get install -y golang
sudo apt-get install -y make nginx gunicorn python-gevent python-flask

# unfortunately this excess baggage is still necessary until I finish ripping
# out all the PGIS stuff from the spelunker... which maybe we don't want to do
# because it's good to remember that all of this stuff should work with PGIS...
# (20160102/thisisaaronland)

sudo apt-get install -y postgresql-9.3 postgresql-client postgis postgresql-9.3-postgis-scripts python-psycopg2

# See above...
#
# ```
# CREATE TABLE whosonfirst (id BIGINT PRIMARY KEY, parent_id BIGINT, placetype VARCHAR, properties TEXT, geom GEOGRAPHY(MULTIPOLYGON, 4326), centroid GEOGRAPHY(POINT, 4326));
# CREATE INDEX by_geom ON whosonfirst USING GIST(geom);
# CREATE INDEX by_placetype ON whosonfirst (placetype);
# VACUUM ANALYZE;
# ```
# 
# ```
# $> psql -d YOUR_DATBASE -c "CREATE EXTENSION postgis;"
# $> psql -d YOUR_DATABASE -c "CREATE EXTENSION postgis_topology;"
# ```

# https://www.elastic.co/guide/en/elasticsearch/reference/current/setup-service.html

sudo add-apt-repository ppa:webupd8team/java -y
sudo apt-get install oracle-java8-installer -y

# https://www.elastic.co/guide/en/elasticsearch/reference/current/setup-repositories.html

wget -qO - https://packages.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
echo "deb http://packages.elastic.co/elasticsearch/1.7/debian stable main" | sudo tee -a /etc/apt/sources.list.d/elasticsearch-1.7.list
sudo apt-get update && sudo apt-get install elasticsearch
sudo update-rc.d elasticsearch defaults 95 10

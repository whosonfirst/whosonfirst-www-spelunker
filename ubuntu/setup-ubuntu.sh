#!/bin/sh

WHOAMI=`python -c 'import os, sys; print os.path.realpath(sys.argv[1])' $0`

PARENT=`dirname $WHOAMI`
PROJECT=`dirname $PARENT`

sudo apt-get update
sudo apt-get upgrade -y

sudo apt-get install -y git tcsh emacs24-nox htop sysstat ufw fail2ban unattended-upgrades python-setuptools unzip
sudo apt-get install -y gdal-bin
# there is no need and anyway apt- installs a freakishly old version
# of Go because... (20160205/thisisaaronland)
# sudo apt-get install -y golang
sudo apt-get install -y make nginx gunicorn python-gevent python-flask

# unfortunately this excess baggage is still necessary until I finish ripping
# out all the PGIS stuff from the spelunker... which maybe we don't want to do
# because it's good to remember that all of this stuff should work with PGIS...
# (20160102/thisisaaronland)

sudo apt-get install -y postgresql-9.3 postgresql-client postgis postgresql-9.3-postgis-scripts python-psycopg2

# See above...

# echo "MAKING POSTGRES DESPERATELY INSECURE ON LOCALHOST"
# sudo cp /etc/postgresql/9.3/main/pg_hba.conf /etc/postgresql/9.3/main/pg_hba.conf.bak
# sudo perl -p -i -e 's/local\s+all\s+postgres\s+peer/local\tall\tpostgres\ttrust/' /etc/postgresql/9.3/main/pg_hba.conf

# if sudo -u postgres psql -lqt | cut -d '|' -f 1 | grep -w whosonfirst; then
#     echo "whosonfirst database already exists"
# else
#     sudo -u postgres createdb whosonfirst
#     sudo -u postgres psql -d whosonfirst -c "CREATE EXTENSION postgis;"
#     sudo -u postgres psql -d whosonfirst -c "CREATE EXTENSION postgis_topology;"
#     sudo -u postgres psql -d whosonfirst -c "CREATE TABLE whosonfirst (id BIGINT PRIMARY KEY, parent_id BIGINT, placetype VARCHAR, properties TEXT, geom GEOGRAPHY(MULTIPOLYGON, 4326), centroid GEOGRAPHY(POINT, 4326));"
#     sudo -u postgres psql -d whosonfirst -c "CREATE INDEX by_geom ON whosonfirst USING GIST(geom);"
#     sudo -u postgres psql -d whosonfirst -c "CREATE INDEX by_placetype ON whosonfirst (placetype);"
#     sudo -u postgres psql -d whosonfirst -c "VACUUM ANALYZE;"
# fi

${PARENT}/setup-elasticsearch.sh

#!/bin/sh

WHOAMI=`python -c 'import os, sys; print os.path.realpath(sys.argv[1])' $0`

PARENT=`dirname $WHOAMI`
PROJECT=`dirname $PARENT`

sudo apt-get install -y postgresql-9.3 postgresql-client postgis postgresql-9.3-postgis-scripts python-psycopg2

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

exit 0

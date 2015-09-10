# whosonfirst-www-spelunker

A simple Flask-based spelunker for poking around Who's On First data (stored in [PostGIS](https://github.com/mapzen/py-mapzen-whosonfirst-spatial) and [Elasticsearch](https://github.com/mapzen/py-mapzen-whosonfirst-search)).

## IMPORTANT

This is still a **work in progress**. As such it lacks proper documentation or
build instructions. Those will be added in relatively short order.

It is also important to understand that the spelunker is still as much a
public-facing resource to help work through what the public-facing resource
(spelunker) _should_ as it is to help us (Mapzen) visualize and sanity check the
data.

The spelunker does many things but it does not do everything, yet or in some
cases ever.

## Data

## Sources (the raw data)

You will need to have a copy of [whosonfirst-data
repository](https://github.com/whosonfirst/whosonfirst-data/) and/or [whosonfirst-venue
repository](https://github.com/whosonfirst/whosonfirst-venue/) available locally
on your machine.

Keep in mind that the `whosonfirst-venue` repository is **VERY VERY BIG**. It's
full of interesting stuff but if you're pressed for time or disk space you
should probably start with the `whosonfirst-data` repository which is more manageable.

## Sources (for the spelunker):

The spelunker assumes two data sources that it reads from:

* A PostGIS database with data imported using
  [py-mapzen-whosonfirst-spatial](https://github.com/whosonfirst/py-mapzen-whosonfirst-spatial)

* An Elasticsearch database with data imported using
  [py-mapzen-whosonfirst-search](https://github.com/whosonfirst/py-mapzen-whosonfirst-search)

_As of this writing you can safely skip the PostGIS step since there is no
spatial-specific functionality in the spelunker. There will be eventually,
though._

## Setup

### Setting up PostGIS

Assuming you already have a copy of PostGIS up and running you should create a table called `whosonfirst` like this:

```
CREATE TABLE whosonfirst (id BIGINT PRIMARY KEY, parent_id BIGINT, placetype VARCHAR, properties TEXT, geom GEOGRAPHY(MULTIPOLYGON, 4326), centroid GEOGRAPHY(POINT, 4326));
CREATE INDEX by_geom ON whosonfirst USING GIST(geom);
CREATE INDEX by_placetype ON whosonfirst (placetype);
VACUUM ANALYZE;
```

If you _don't_ have a copy of PostGIS (or Postgres) up and running the details
of doing so are outside the scope of this document but the [PostGIS website has
excellent documentation for doing
so](http://postgis.net/docs/manual-2.1/postgis_installation.html).

If you're thinking of using something like [Amazon's RDS Postgres service](https://aws.amazon.com/rds/postgresql/)
you can also just type the following (after you've created your database):

```
$> psql -d YOUR_DATBASE -c "CREATE EXTENSION postgis;"
$> psql -d YOUR_DATABASE -c "CREATE EXTENSION postgis_topology;"
```

### Setting up Elasticsearch

There are no spelunker-specific instructions for setting up Elasticsearch. You
can use any current installation of Elasticsearch as-is. Setting up and
configuring Elasticsearch is outside the scope of this document but the
[Elasticsearch website has excellent documentation for doing so](https://www.elastic.co/guide/en/elasticsearch/guide/current/_installing_elasticsearch.html).

### Setting up the Spelunker

### Dependencies

* flask
* mapzen.whosonfirst.spatial
* mapzen.whosonfirst.search
* mapzen.whosonfirst.placetypes

## Indexing

### Indexing PostGIS data

Indexing PostGIS data for the spelunker is done with the `wof-spatial-index`
script (which is installed as part of  [py-mapzen-whosonfirst-spatial](https://github.com/whosonfirst/py-mapzen-whosonfirst-spatial)).

```
/usr/local/bin/wof-spatial-index -s /YOUR/PATH/TO/whosonfirst-data/data/ -c /YOUR/PATH/TO/whosonfirst.cfg
```

_The config file contains the database credentials and is discussed in detail
below._

### Indexing Elasticsearch data

Indexing Elasticsearch data for the spelunker is done with the `wof-es-index`
script (which is installed as part of  [py-mapzen-whosonfirst-search](https://github.com/whosonfirst/py-mapzen-whosonfirst-search)).

```
/usr/local/bin/wof-es-index -s /usr/local/mapzen/whosonfirst-data/data/ -b
```

The `-b` in the command above is to enable bulk indexing which just makes
everything faster.

_By default the script attempts to indexing an instance of Elasticsearch running
on the same machine (localhost) but you can specify an alternate endpoint with
the `-h` flag. As of this writing there is support for reading that sort of
stuff from a config file (like happens with the PostGIS indexing) but there
should be._

### Config files

Config files are simple [INI style config files](https://en.wikipedia.org/wiki/INI_file).

### PostGIS config settings

You will need to ensure that there is a section labeled `whosonfirst` with the
following settings:

```
[whosonfirst]
db_host=PSQL_HOST
db_name=PSQL_DATABASE
db_user=PSQL_USERAME
db_pswd=PSQL_PASSWORD
```

## See also

* http://whosonfirst.mapzen.com/
* https://mapzen.com/blog/who-s-on-first
* https://github.com/whosonfirst/whosonfirst-data
* https://github.com/whosonfirst/whosonfirst-venue

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

This assumes two data sources:

* A PostGIS database with data imported using [py-mapzen-whosonfirst-spatial](https://github.com/whosonfirst/py-mapzen-whosonfirst-spatial)
* An ElasticSearch database with data imported using [py-mapzen-whosonfirst-search](https://github.com/whosonfirst/py-mapzen-whosonfirst-search)

## See also

* https://github.com/whosonfirst/whosonfirst-data

* https://github.com/whosonfirst/py-mapzen-whosonfirst-search
* https://github.com/whosonfirst/py-mapzen-whosonfirst-spatial

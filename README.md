# whosonfirst-www-spelunker

A simple Flask-based spelunker for poking around Who's On First data stored in an [Elasticsearch](https://github.com/mapzen/py-mapzen-whosonfirst-search)) document index.

The spelunker is very much a tool to help work through what the public-facing resource (spelunker) _should_ as it is to help us (Mapzen) visualize and sanity check the
data. The spelunker does many things but it does not do everything yet, or in some cases ever.

## Installation

The Who's On First spelunker is primarily designed for running on a Ubuntu Linux distribution. It's not designed _for_ a Ubuntu distribution so adapting it to another platform shouldn't be difficult but that is not work we've done yet.

There is also a handy [vagrant-whosonfirst-www-spelunker](https://github.com/whosonfirst/vagrant-whosonfirst-www-spelunker) Vagrant package for building all the software dependencies and running a copy of the spelunker on your local machine. That's probably a good (better) place to start if you just want to poke around a local copy of the Who's On First data.

If you're feeling confident or dangerous or both there is a handy `Makefile` included that will attempt to install and configure everything you need to fire up a copy of the spelunker over an encrypted connection at `https://localhost/`. Like this:

```
make build
```

Note that default build scripts will create a self-signed TLS certificate so you should expect your browser to display a security warning. The `build` target is actually just a wrapper around three other targets: `setup`, `data` and `index` which are all (hopefully) self-explanatory but the gorey details follow below.

### Software

Currently all the packaging and dependencies target a modern Ubuntu Linux distribution. There is little (nothing) that is really Ubuntu-specific but in the interest of getting things done that's the focus right now. All of scripts to install the spelunker and its dependencies are found in the `ubuntu` folder so you can run them each atomically if you need to. There are also two `Makefile` targets for installing all the software and indexing the data. Like this:

```
make setup
make index
```

These are separate targets because depending on the machine you're using indexing the data can take quite a long time. _Please be sure to read the section on data (below) for charging ahead and invoking the Makefile or installing software._

### Data sources

The convention is to store all Who's On First (WOF) data in a root `/usr/local/mapzen/whosonfirst-data` directory. That is however just a convention. For the purposes of the spelunker we care about the location of WOF data in three places:

* The indexing scripts for storing WOF data in one or more database (like Elasticsearch)
* The config file for the webserver (nginx) so that it knows how to resolve requests for a WOF document
* The `make-data.sh` script which will fetch WOF data "bundles" from the Internet and store them locally

#### make-data.sh

The `ubuntu/make-data.sh` script is a small tool that will download bundled versions of [common placetypes in WOF]() and store them in a sub-directory of _this repository_ called `data`. You can override the destination folder by passing in a path (to a folder) as the first argument to the script. For example:

```
$> ubuntu/make-data.sh /path/to/some-other/whosonfirst-data/folder
```

If you are invoking the `data` target from the Makefile you would prepend the target with a `data=path` argument. For example:

```
make data=/path/to/some-other/whosonfirst-data/folder data
```

#### Telling the rest of the spelunker about your data source

The short version is that, as in the examples above, relevant scripts in the `ubunut` directory will accept an alternative data path as their first argument and relevant make targets will accept a `data=path` prefix.

The relevant `ubuntu` scripts are:

* setup-data.sh
* setup-elasticsearch-index.sh
* setup-nginx.sh

The relevant `make` targets are:

* data
* index
* setup _- because it invokes the `setup-nginx.sh` script_

## See also

* https://github.com/whosonfirst/vagrant-whosonfirst-www-spelunker
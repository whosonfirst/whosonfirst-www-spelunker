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

## Installation

First of all there is a handy [vagrant-whosonfirst-www-spelunker](https://github.com/whosonfirst/vagrant-whosonfirst-www-spelunker) Vagrant package for building all the software dependencies and running a copy of the spelunker on your local machine. That's probably a good (better) place to start if you just want to poke around a local copy of the Who's On First data.

The gorey details follow.

### Software

Currently all the packaging and dependencies target a modern Ubuntu Linux distribution. There is little (nothing) that is really Ubuntu-specific but in the interest of getting things done that's the focus right now. All of scripts to install the spelunker and its dependencies are found in the `ubuntu` folder so you can run them each atomically if you need to. There are also two `Makefile` targets for installing all the software and indexing the data. Like this:

```
make setup
make index
```

These are separate targets because depending on the machine you're using indexing the data can take quite a long time.

### Data sources

_Everything here is basically correct but if you're reading this it means that we are still in the process of working through some boring (but important) details about how and where the data lives. The current easiest-thing is to skip the `whosonfirst-venue` data altogether and simply make sure that a copy of the `whosonfirst-data` repository lives in the `/usr/local/mapzen` folder (which you may need to create manually)._

You will need to have a copy of [whosonfirst-data
repository](https://github.com/whosonfirst/whosonfirst-data/) and/or [whosonfirst-venue
repository](https://github.com/whosonfirst/whosonfirst-venue/) available locally
on your machine.

Keep in mind that the `whosonfirst-venue` repository is **VERY VERY BIG**. It's
full of interesting stuff but if you're pressed for time or disk space you
should probably start with the `whosonfirst-data` repository which is more manageable.

## See also

* https://github.com/whosonfirst/vagrant-whosonfirst-www-spelunker
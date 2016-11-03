#!/bin/sh

sudo apt-get install python-pip

sudo pip install https://github.com/whosonfirst/py-mapzen-whosonfirst-search/tarball/master
sudo pip install https://github.com/whosonfirst/py-mapzen-whosonfirst-utils/tarball/master
sudo pip install https://github.com/whosonfirst/py-mapzen-whosonfirst-placetypes/tarball/master

exit 0

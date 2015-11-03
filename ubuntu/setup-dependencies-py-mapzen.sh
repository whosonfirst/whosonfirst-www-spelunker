#!/bin/sh

GIT=`which git`

if [ -f /usr/local/mapzen/py-mapzen-whosonfirst-placetypes ]
then
    cd /usr/local/mapzen/py-mapzen-whosonfirst-placetypes
    git pull origin master
else
    git clone git@github.com:whosonfirst/py-mapzen-whosonfirst-placetypes.git /usr/local/mapzen/py-mapzen-whosonfirst-placetypes
    cd /usr/local/mapzen/py-mapzen-whosonfirst-placetypes
fi 

sudo python setup.py install
cd -

if [ -f /usr/local/mapzen/py-mapzen-whosonfirst-utils ]
then
    cd /usr/local/mapzen/py-mapzen-whosonfirst-utils
    git pull origin master
else
    git clone git@github.com:whosonfirst/py-mapzen-whosonfirst-utils.git /usr/local/mapzen/py-mapzen-whosonfirst-utils
    cd /usr/local/mapzen/py-mapzen-whosonfirst-utils
fi 

sudo python setup.py install
cd -

if [ -f /usr/local/mapzen/py-mapzen-whosonfirst-spatial ]
then
    cd /usr/local/mapzen/py-mapzen-whosonfirst-spatial
    git pull origin master
else
    git clone git@github.com:whosonfirst/py-mapzen-whosonfirst-spatial.git /usr/local/mapzen/py-mapzen-whosonfirst-spatial
    cd /usr/local/mapzen/py-mapzen-whosonfirst-spatial
fi 

sudo python setup.py install
cd -

if [ -f /usr/local/mapzen/py-mapzen-whosonfirst-search ]
then
    cd /usr/local/mapzen/py-mapzen-whosonfirst-search
    git pull origin master
else
    git clone git@github.com:whosonfirst/py-mapzen-whosonfirst-search.git /usr/local/mapzen/py-mapzen-whosonfirst-search
    cd /usr/local/mapzen/py-mapzen-whosonfirst-search
fi 

sudo python setup.py install
cd -



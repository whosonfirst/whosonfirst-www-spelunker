#!/bin/sh

GIT=`which git`

if [ -f /usr/local/mapzen/py-mapzen-whosonfirst ]
then
    cd /usr/local/mapzen/py-mapzen-whosonfirst
    git pull origin master
else
    git clone git@github.com:whosonfirst/py-mapzen-whosonfirst.git /usr/local/mapzen/py-mapzen-whosonfirst
    cd /usr/local/mapzen/py-mapzen-whosonfirst
fi 

sudo python setup.py install
cd -

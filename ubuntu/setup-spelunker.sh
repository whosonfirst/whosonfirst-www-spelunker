#!/bin/sh

DATA=$1		# uhhh... still working this out (20160203/thisisaaronland)

WHOAMI=`python -c 'import os, sys; print os.path.realpath(sys.argv[1])' $0`
PARENT=`dirname $WHOAMI`

PROJECT=`dirname $PARENT`
JAVASCRIPT="${PROJECT}/www/static/javascript/"

if [ ! -f ${JAVASCRIPT}/mapzen.whosonfirst.config.js ]
then

    cp ${JAVASCRIPT}/mapzen.whosonfirst.config.js.example ${JAVASCRIPT}/mapzen.whosonfirst.config.js

fi

exit 0

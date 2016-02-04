#!/bin/sh

WHOAMI=`python -c 'import os, sys; print os.path.realpath(sys.argv[1])' $0`

PARENT=`dirname $WHOAMI`
PROJECT=`dirname $PARENT`

DATA=$1

if [ "${DATA}" = "" ]
then
    DATA="${PROJECT}/data"
fi

if [ ! -d ${DATA} ]
then
    echo "Can not find ${DATA}"
    exit 1
fi

/usr/local/bin/wof-es-index -s ${DATA} -b

exit 0

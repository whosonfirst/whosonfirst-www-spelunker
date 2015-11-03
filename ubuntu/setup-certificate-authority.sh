#!/bin/sh

if [ $(id -u) != 0 ]; then
     echo "Please be root to do this..."
     exit 1
fi

DB=/usr/local/mapzen/lockedbox/certified-ca

if [ -d ${DB} ]
then
    echo "${DB} already exists"
    exit 1
fi

mkdir ${DB}
chmod 700 ${DB}
chown root ${DB}

certified-ca --bits 4096 --db ${DB} C="US" ST="CA" L="San Francisco" O="Whosonfirst" CN="Whosonfirst Spelunker CA" > /usr/local/mapzen/lockedbox/certified-ca/ca.crt

exit 0

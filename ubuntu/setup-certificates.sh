#!/bin/sh

if [ $(id -u) != 0 ]; then
     echo "Please be root to do this..."
     exit 1
fi

CSPLIT=`which csplit`
CERTIFIED=`which certified`

DB=/usr/local/mapzen/lockedbox/certified-ca

if [ -f /usr/local/mapzen/lockedbox/wof-spelunker.key ]
then
    echo "boundary issues key already exists"
    exit 1
fi

if [ -f /usr/local/mapzen/lockedbox/wof-spelunker.crt ]
then
    echo "boundary issues cert already exists"
    exit 1
fi

if [ -f /usr/local/mapzen/lockedbox/wof-spelunker-key-crt.txt ]
then
    rm /usr/local/mapzen/lockedbox/wof-spelunker-key-crt.txt
fi 

PUBLIC_IP=`curl -s http://169.254.169.254/latest/meta-data/public-ipv4`

if [ "${PUBLIC_IP}" = "" ]
then
    PUBLIC_IP='127.0.0.1'
fi

if [ -f /usr/local/mapzen/lockedbox/certified-ca/certs/localhost.crt ]
then
    ${CERTIFIED} --revoke --db ${DB} CN="localhost" +"${PUBLIC_IP}"
fi

${CERTIFIED} --bits 4096 --db ${DB} CN="localhost" +"${PUBLIC_IP}" > /usr/local/mapzen/lockedbox/wof-spelunker-key-crt.txt

if [ ! -f /usr/local/mapzen/lockedbox/wof-spelunker-key-crt.txt  ]
then
    echo "Failed to generate key/certs"
    exit 1
fi

cd /usr/local/mapzen/lockedbox/

${CSPLIT} -k /usr/local/mapzen/lockedbox/wof-spelunker-key-crt.txt '/-----END RSA PRIVATE KEY-----/+1'

if [ ! -f /usr/local/mapzen/lockedbox/xx00 ]
then
    echo "Failed to split wof-spelunker-key-crt.txt correctly"
    exit 1
fi

if [ ! -f /usr/local/mapzen/lockedbox/xx01 ]
then
    echo "Failed to split wof-spelunker-key-crt.txt correctly"
    exit 1
fi

mv /usr/local/mapzen/lockedbox/xx00 /usr/local/mapzen/lockedbox/wof-spelunker.key
mv /usr/local/mapzen/lockedbox/xx01 /usr/local/mapzen/lockedbox/wof-spelunker.crt

chown root /usr/local/mapzen/lockedbox/wof-spelunker.key
chmod 600 /usr/local/mapzen/lockedbox/wof-spelunker.key

chown root /usr/local/mapzen/lockedbox/wof-spelunker.crt
chmod 600 /usr/local/mapzen/lockedbox/wof-spelunker.crt

cd -

rm /usr/local/mapzen/lockedbox/wof-spelunker-key-crt.txt

exit 0

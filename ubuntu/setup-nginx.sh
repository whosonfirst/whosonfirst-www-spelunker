#!/bin/sh

PERL=`which perl`

if [ ! -f /usr/local/mapzen/whosonfirst-www-spelunker/nginx/whosonfirst-www-spelunker.conf ]
then
    cp /usr/local/mapzen/whosonfirst-www-spelunker/nginx/whosonfirst-www-spelunker.conf.example /usr/local/mapzen/whosonfirst-www-spelunker/nginx/whosonfirst-www-spelunker.conf
    ${PERL} -p -i -e 's!YOUR-SSL-CERTIFICATE-GOES-HERE!/usr/local/mapzen/lockedbox/wof-spelunker.crt!g' /usr/local/mapzen/whosonfirst-www-spelunker/nginx/whosonfirst-www-spelunker.conf
    ${PERL} -p -i -e 's!YOUR-SSL-CERTFICATE-GOES-HERE!/usr/local/mapzen/lockedbox/wof-spelunker.key!g' /usr/local/mapzen/whosonfirst-www-spelunker/nginx/whosonfirst-www-spelunker.conf
fi

if [ -L /etc/nginx/sites-enabled/default ]
then
    sudo rm /etc/nginx/sites-enabled/default
fi

if [ -f /etc/nginx/sites-enabled/whosonfirst-www-spelunker.conf ]
then
    sudo rm /etc/nginx/sites-enabled/whosonfirst-www-spelunker.conf
fi

if [ -L /etc/nginx/sites-enabled/whosonfirst-www-spelunker.conf ]
then
    sudo rm /etc/nginx/sites-enabled/whosonfirst-www-spelunker.conf
fi

sudo ln -s /usr/local/mapzen/whosonfirst-www-spelunker/nginx/whosonfirst-www-spelunker.conf /etc/nginx/sites-enabled/whosonfirst-www-spelunker.conf

sudo /etc/init.d/nginx restart
exit 0

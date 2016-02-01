#!/bin/sh

PERL=`which perl`

if [ ! -f /usr/local/mapzen/whosonfirst-www-spelunker/gunicorn/whosonfirst-www-spelunker.cfg ]
then
    cp /usr/local/mapzen/whosonfirst-www-spelunker/gunicorn/whosonfirst-www-spelunker.cfg.example /usr/local/mapzen/whosonfirst-www-spelunker/gunicorn/whosonfirst-www-spelunker.cfg

    ${PERL} -p -i -e 's!YOUR-SPELUNKER-PORT-GOES-HERE!7777!' /usr/local/mapzen/whosonfirst-www-spelunker/gunicorn/whosonfirst-www-spelunker.cfg
    ${PERL} -p -i -e 's!YOUR-SPELUNKER-WWW-GOES-HERE!/usr/local/mapzen/whosonfirst-www-spelunker/www!' /usr/local/mapzen/whosonfirst-www-spelunker/gunicorn/whosonfirst-www-spelunker.cfg
    ${PERL} -p -i -e 's!YOUR-SPELUNKER-CONFIG-NAME-GOES-HERE!/usr/local/mapzen/whosonfirst-www-spelunker/spelunker.cfg!' /usr/local/mapzen/whosonfirst-www-spelunker/gunicorn/whosonfirst-www-spelunker.cfg
fi

if [ ! -f /usr/local/mapzen/whosonfirst-www-spelunker/init.d/whosonfirst-www-spelunker.sh ]
then

    cp /usr/local/mapzen/whosonfirst-www-spelunker/init.d/whosonfirst-www-spelunker.sh.example /usr/local/mapzen/whosonfirst-www-spelunker/init.d/whosonfirst-www-spelunker.sh

    ${PERL} -p -i -e 's!YOUR-WHOSONFIRST-WWW-SPELUNKER-WWW-ROOT-GOES-HERE!/usr/local/mapzen/whosonfirst-www-spelunker/www!' /usr/local/mapzen/whosonfirst-www-spelunker/init.d/whosonfirst-www-spelunker.sh
    ${PERL} -p -i -e 's!YOUR-WHOSONFIRST-WWW-SPELUNKER-GUNICORN-CONFIG-GOES-HERE!/usr/local/mapzen/whosonfirst-www-spelunker/gunicorn/whosonfirst-www-spelunker.cfg!' /usr/local/mapzen/whosonfirst-www-spelunker/init.d/whosonfirst-www-spelunker.sh

fi

if [ ! -f /etc/init.d/whosonfirst-www-spelunker.sh ]
then
    sudo ln -s /usr/local/mapzen/whosonfirst-www-spelunker/init.d/whosonfirst-www-spelunker.sh /etc/init.d/whosonfirst-www-spelunker.sh
    sudo update-rc.d whosonfirst-spelunker-server.sh defaults
fi

echo "please finish writing me"
exit 1

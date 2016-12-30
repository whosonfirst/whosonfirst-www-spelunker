#!/bin/sh

WHOAMI=`python -c 'import os, sys; print os.path.realpath(sys.argv[1])' $0`
PARENT=`dirname $WHOAMI`

PROJECT=`dirname $PARENT`
PROJECT_NAME=`basename ${PROJECT}`

PERL=`which perl`

FLASK_CONFIG_NAME="${PROJECT_NAME}-flask.cfg"
FLASK_CONFIG_PATH="${PROJECT}/config/${FLASK_CONFIG_NAME}"

GUNICORN_CONFIG_NAME="${PROJECT_NAME}-gunicorn.cfg"
GUNICORN_CONFIG_PATH="${PROJECT}/config/${GUNICORN_CONFIG_NAME}"

INITD_PATH="${PROJECT}/init.d/${PROJECT_NAME}.sh"

if [ ! -f ${FLASK_CONFIG_PATH} ]
then
    cp ${FLASK_CONFIG_PATH}.example ${FLASK_CONFIG_PATH}

    ${PERL} -p -i -e "s!YOUR-SPELUNKER-SEARCH-HOST-GOES-HERE!localhost!" ${FLASK_CONFIG_PATH}
    ${PERL} -p -i -e "s!YOUR-SPELUNKER-SEARCH-PORT-GOES-HERE!9200!" ${FLASK_CONFIG_PATH}
    ${PERL} -p -i -e "s!YOUR-SPELUNKER-SEARCH-INDEX-GOES-HERE!spelunker!" ${FLASK_CONFIG_PATH}

fi

if [ ! -f ${GUNICORN_CONFIG_PATH} ]
then
    cp ${GUNICORN_CONFIG_PATH}.example ${GUNICORN_CONFIG_PATH}

    ${PERL} -p -i -e "s!YOUR-SPELUNKER-WWW-HOST-GOES-HERE!localhost!" ${GUNICORN_CONFIG_PATH}
    ${PERL} -p -i -e "s!YOUR-SPELUNKER-WWW-PORT-GOES-HERE!7777!" ${GUNICORN_CONFIG_PATH}
    ${PERL} -p -i -e "s!YOUR-SPELUNKER-WWW-ROOT-GOES-HERE!${PROJECT}/www!" ${GUNICORN_CONFIG_PATH}
    ${PERL} -p -i -e "s!YOUR-SPELUNKER-FLASK-CONFIG-GOES-HERE!${FLASK_CONFIG_PATH}!" ${GUNICORN_CONFIG_PATH}
fi

if [ ! -f ${PROJECT}/init.d/${PROJECT_NAME}.sh ]
then

    cp ${INITD_PATH}.example ${INITD_PATH}

    ${PERL} -p -i -e "s!YOUR-SPELUNKER-NAME!${PROJECT_NAME}!g" ${INITD_PATH}
    ${PERL} -p -i -e "s!YOUR-SPELUNKER-WWW-ROOT-GOES-HERE!${PROJECT}/www!" ${INITD_PATH}
    ${PERL} -p -i -e "s!YOUR-SPELUNKER-GUNICORN-CONFIG-GOES-HERE!${GUNICORN_CONFIG_PATH}!" ${INITD_PATH}

fi

if [ ! -f /etc/init.d/${PROJECT_NAME}.sh ]
then
    sudo ln -s ${INITD_PATH} /etc/init.d/${PROJECT_NAME}.sh
    sudo update-rc.d ${PROJECT_NAME}.sh defaults
    sudo /etc/init.d/${PROJECT_NAME}.sh start
fi

exit 0

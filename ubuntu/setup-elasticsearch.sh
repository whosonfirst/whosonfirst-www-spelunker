#!/bin/sh

# because this (20160205/thisisaaronland)
#
# A: I have an elasticsearch question: do you have an opinion about whether there any practical benefit in running it with the oracle
# java8 stuff or is the openjdk7 stuff just fine?
# A: I ask only because the former makes installs/build fiddly because of that stupid license modal dialog
# B: i always run with oracle java
# B: I have first hand experience of openjdk sucking
# B: at least with ES
# A: what was the suckage?
# B: this was some time ago. that said, all our ES installs (and java installs) done with chef obviate any problem with the dialog issue
# B: basically it would fail during indexing with openjdk for what we were working on at the time
# B: but chugged through without incident with oracle

WHOAMI=`python -c 'import os, sys; print os.path.realpath(sys.argv[1])' $0`

PARENT=`dirname $WHOAMI`
PROJECT=`dirname $PARENT`
PROJECT_NAME=`basename ${PROJECT}`

ELASTICSEARCH_CONFIG_PATH="${PROJECT}/config/${PROJECT_NAME}-elasticsearch.conf"

# see also: https://github.com/whosonfirst/whosonfirst-www-spelunker/issues/18

# https://www.elastic.co/guide/en/elasticsearch/reference/current/setup-service.html

sudo add-apt-repository ppa:webupd8team/java -y

sudo apt-get update
sudo apt-get install oracle-java8-installer -y

curl -o /tmp/elasticsearch-2.4.0.deb https://download.elastic.co/elasticsearch/release/org/elasticsearch/distribution/deb/elasticsearch/2.4.0/elasticsearch-2.4.0.deb
curl -o /tmp/elasticsearch-2.4.0.deb.sha1 https://download.elastic.co/elasticsearch/release/org/elasticsearch/distribution/deb/elasticsearch/2.4.0/elasticsearch-2.4.0.deb.sha1

remote_sha1=`cat /tmp/elasticsearch-2.4.0.deb.sha1`
local_sha1=`sha1sum /tmp/elasticsearch-2.4.0.deb | cut -c1-40`

if [ "$remote_sha1" != "$local_sha1" ]
then
    echo "Uh oh, elasticsearch SHA1 checksum is invalid."
    exit 1
fi

sudo dpkg -i /tmp/elasticsearch-2.4.0.deb
sudo update-rc.d elasticsearch defaults 95 10

rm /tmp/elasticsearch-2.4.0.deb
rm /tmp/elasticsearch-2.4.0.deb.sha1

sudo apt-get update
sudo apt-get install elasticsearch

if [ ! -f ${ELASTICSEARCH_CONFIG_PATH} ]
then
    cp ${ELASTICSEARCH_CONFIG_PATH}.example ${ELASTICSEARCH_CONFIG_PATH}

    sudo mv /etc/default/elasticsearch /etc/default/.elasticsearch.dist
    sudo ln -s ${ELASTICSEARCH_CONFIG_PATH} /etc/default/elasticsearch
fi

# sudo update-rc.d elasticsearch defaults 95 10

if [ ! -f /var/run/elasticsearch/elasticsearch.pid ]
then
     sudo /etc/init.d/elasticsearch start
     sleep 10
else

	PID=`cat /var/run/elasticsearch/elasticsearch.pid`
	COUNT=`ps -p ${PID} | grep java | wc -l`

	if [ ${COUNT} = 0 ]
	then

	    echo "Elasticsearch isn't running BECAUSE COMPUTERS so trying to restart"
	    sudo /etc/init.d/elasticsearch start
	    sleep 10
	else
	    sudo /etc/init.d/elasticsearch restart
	fi
fi

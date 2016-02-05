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

# see also: https://github.com/whosonfirst/whosonfirst-www-spelunker/issues/18

# https://www.elastic.co/guide/en/elasticsearch/reference/current/setup-service.html

sudo add-apt-repository ppa:webupd8team/java -y
sudo apt-get install oracle-java8-installer -y

# https://www.elastic.co/guide/en/elasticsearch/reference/current/setup-repositories.html

wget -qO - https://packages.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
echo "deb http://packages.elastic.co/elasticsearch/1.7/debian stable main" | sudo tee -a /etc/apt/sources.list.d/elasticsearch-1.7.list

sudo apt-get update && sudo apt-get install elasticsearch
sudo update-rc.d elasticsearch defaults 95 10

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
	fi
fi

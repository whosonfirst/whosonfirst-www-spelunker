#!/bin/sh

WHOAMI=`python -c 'import os, sys; print os.path.realpath(sys.argv[1])' $0`

PARENT=`dirname $WHOAMI`
PROJECT=`dirname $PARENT`

sudo apt-get update
sudo apt-get upgrade -y

sudo apt-get install -y git tcsh emacs24-nox htop sysstat ufw fail2ban unattended-upgrades python-setuptools unzip
sudo dpkg-reconfigure --priority=low unattended-upgrades

sudo apt-get install -y gdal-bin
# there is no need and anyway apt- installs a freakishly old version
# of Go because... (20160205/thisisaaronland)
# sudo apt-get install -y golang
sudo apt-get install -y make nginx gunicorn python-gevent python-flask

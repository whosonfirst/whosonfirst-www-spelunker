#!/bin/sh

WHOAMI=`python -c 'import os, sys; print os.path.realpath(sys.argv[1])' $0`

PARENT=`dirname $WHOAMI`
PROJECT=`dirname $PARENT`

sudo apt-get update
sudo apt-get upgrade -y

sudo add-apt-repository universe
sudo apt-get update

sudo apt-get install -y git tcsh emacs24-nox htop sysstat ufw fail2ban unattended-upgrades python-setuptools unzip
sudo dpkg-reconfigure -f noninteractive --priority=low unattended-upgrades

sudo apt-get install -y gdal-bin
sudo apt-get install -y make nginx gunicorn python-gevent python-flask

sudo easy_install pycountry
sudo easy_install flask-cors

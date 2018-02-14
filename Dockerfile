# https://www.whosonfirst.org/blog/2017/12/21/wof-in-a-box/

# docker build -t wof-spelunker .
# docker run -it -p 7778:7777 wof-spelunker

FROM ubuntu:16.04

RUN apt-get update && apt-get -y dist-upgrade && apt-get -y autoremove

RUN apt-get install -y python-pip python-pyparsing python-setuptools libpython-dev libssl-dev libffi-dev
RUN python -m pip install --upgrade --force pip
RUN pip install --upgrade setuptools
RUN pip install --upgrade pyopenssl ndg-httpsclient pyasn1 'requests[security]'

RUN apt-get install -y git gunicorn python-gevent gdal-bin
RUN pip install flask flask-cors pycountry

RUN mkdir -p /usr/local/whosonfirst

RUN git clone https://github.com/whosonfirst/py-mapzen-whosonfirst.git /usr/local/whosonfirst/py-mapzen-whosonfirst
RUN cd /usr/local/whosonfirst/py-mapzen-whosonfirst && pip install --upgrade -r requirements.txt --process-dependency-links .

RUN git clone https://github.com/whosonfirst/whosonfirst-www-spelunker.git /usr/local/whosonfirst/whosonfirst-www-spelunker

# THIS IS A HACK to account for the fact that we require `sudo` in the ubuntu/setup* scripts
# maybe we shouldn't but it does make things easier for people just cloning a repo and trying
# things out... (20180214/thisisaaronland)

RUN apt-get install -y sudo

RUN cd /usr/local/whosonfirst/whosonfirst-www-spelunker && ./ubuntu/setup-spelunker.sh && ./ubuntu/setup-gunicorn.sh

RUN perl -p -i -e "s!spelunker_host = 'localhost'!spelunker_host = '0.0.0.0'!g" /usr/local/whosonfirst/whosonfirst-www-spelunker/config/whosonfirst-www-spelunker-gunicorn.cfg

# we also need sudo below for the init.d script... (20180214/thisisaaronland)
# RUN export SUDO_FORCE_REMOVE=yes && apt-get remove -y sudo

RUN touch /var/log/spelunker && chown www-data:www-data /var/log/spelunker

# TO DO - update configs (see above) with pointers for HOST or ES stuff as necessary
# hello YA "entrypoint" file... (20180214/thisisaaronland)

CMD /etc/init.d/whosonfirst-www-spelunker.sh debug
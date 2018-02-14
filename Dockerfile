# https://www.whosonfirst.org/blog/2017/12/21/wof-in-a-box/

# docker build -t wof-spelunker .

FROM ubuntu:16.04

RUN apt-get update && apt-get dist-upgrade && apt-get autoremove

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
RUN cd /usr/local/whosonfirst/whosonfirst-www-spelunker && ./ubuntu/setup-spelunker.sh && ./ubuntu/setup-gunicorn.sh

RUN touch /var/log/spelunker && chown www-data:www-data /var/log/spelunker
 
# config file wah wah

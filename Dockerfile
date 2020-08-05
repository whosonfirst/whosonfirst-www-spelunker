FROM whosonfirst-spelunker-base

RUN apk update && apk upgrade \
    #
    && mkdir /build \
    #
    # && cd /build \
    # && wget -O spelunker.tar.gz https://github.com/whosonfirst/whosonfirst-www-spelunker/archive/v0.9.2.tar.gz && tar -xvzf spelunker.tar.gz \
    # && cd whosonfirst-www-spelunker-0.9.2 \
    # && pip3 install -r requirements.txt \
    #
    && cd /build \
    && wget -O machinetag.tar.gz https://github.com/whosonfirst/py-machinetag/archive/v2.0.0.tar.gz && tar -xvzf machinetag.tar.gz \
    && cd py-machinetag-2.0.0 \
    && pip3 install -r requirements.txt . \    
    #
    && mkdir -p /usr/local/whosonfirst/whosonfirst-www-spelunker/ \
    # && cp -r www /usr/local/whosonfirst/whosonfirst-www-spelunker/ \
    # && cp -r config /usr/local/whosonfirst/whosonfirst-www-spelunker/ \
    #
    # && cp /usr/local/whosonfirst/whosonfirst-www-spelunker/config/whosonfirst-www-spelunker-gunicorn.cfg.example /usr/local/whosonfirst/whosonfirst-www-spelunker/config/whosonfirst-www-spelunker-gunicorn.cfg \
    # && cp /usr/local/whosonfirst/whosonfirst-www-spelunker/config/whosonfirst-www-spelunker-flask.cfg.example /usr/local/whosonfirst/whosonfirst-www-spelunker/config/whosonfirst-www-spelunker-flask.cfg \
    #
    && cd - \
    && rm -rf /build

COPY www /usr/local/whosonfirst/whosonfirst-www-spelunker/www/ 
COPY config /usr/local/whosonfirst/whosonfirst-www-spelunker/config/ 

COPY config/whosonfirst-www-spelunker-gunicorn.cfg.example /usr/local/whosonfirst/whosonfirst-www-spelunker/config/whosonfirst-www-spelunker-gunicorn.cfg 
COPY config/whosonfirst-www-spelunker-flask.cfg.example /usr/local/whosonfirst/whosonfirst-www-spelunker/config/whosonfirst-www-spelunker-flask.cfg 

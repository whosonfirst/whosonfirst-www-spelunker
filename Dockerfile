FROM whosonfirst-spelunker-base

RUN apk update && apk upgrade \
    #
    && mkdir /build \
    #
    && cd /build \
    && wget -O spelunker.tar.gz https://github.com/whosonfirst/whosonfirst-www-spelunker/archive/v0.9.2.tar.gz && tar -xvzf spelunker.tar.gz \
    && cd whosonfirst-www-spelunker-0.9.2 \
    && pip3 install -r requirements.txt . \


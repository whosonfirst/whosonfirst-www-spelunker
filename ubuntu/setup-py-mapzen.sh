#!/bin/sh

sudo easy_install https://github.com/whosonfirst/py-mapzen-whosonfirst-search/tarball/master
sudo easy_install https://github.com/whosonfirst/py-mapzen-whosonfirst-utils/tarball/master
sudo easy_install https://github.com/whosonfirst/py-mapzen-whosonfirst-placetypes/tarball/master

# maybe some day but not today because: https://github.com/mapzen/mapzen-www-places/pull/29
# sudo apt-get install python-pip
# sudo pip install https://github.com/whosonfirst/py-mapzen-whosonfirst-search/tarball/master
# sudo pip install https://github.com/whosonfirst/py-mapzen-whosonfirst-utils/tarball/master
# sudo pip install https://github.com/whosonfirst/py-mapzen-whosonfirst-placetypes/tarball/master

exit 0

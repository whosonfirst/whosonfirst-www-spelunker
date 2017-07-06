#!/bin/sh

# the old way that we know works
# and the new way that we are trying to make sure works...
# (20161104/thisisaaronland)

# sudo easy_install https://github.com/whosonfirst/py-mapzen-whosonfirst-elasticsearch/tarball/master
# sudo easy_install https://github.com/whosonfirst/py-mapzen-whosonfirst-utils/tarball/master
# sudo easy_install https://github.com/whosonfirst/py-mapzen-whosonfirst-placetypes/tarball/master
# sudo easy_install https://github.com/whosonfirst/py-mapzen-whosonfirst-sources/tarball/master

sudo apt-get install python-pip

sudo pip install https://github.com/whosonfirst/py-mapzen-whosonfirst-search/tarball/master --process-dependency-links
sudo pip install https://github.com/whosonfirst/py-mapzen-whosonfirst-utils/tarball/master --process-dependency-links
sudo pip install https://github.com/whosonfirst/py-mapzen-whosonfirst-placetypes/tarball/master --process-dependency-links
sudo pip install https://github.com/whosonfirst/py-mapzen-whosonfirst-sources/tarball/master --process-dependency-links
sudo pip install https://github.com/whosonfirst/py-mapzen-whosonfirst-languages/tarball/master --process-dependency-links

exit 0

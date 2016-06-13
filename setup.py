#!/usr/bin/env python

from setuptools import setup, find_packages

version = '0.1'

setup(
    name='mapzen.whosonfirst.spelunker',
    version=version,
    description='The Who\'s On First spelunker',
    author='Mapzen',
    url='https://github.com/whosonfirst/whosonfirst-www-spelunker',
    install_requires=[
        'flask',
        'pycountry'
        'machinetag>=1.4',
        'machinetag.elasticsearch>=0.3',
        'whosonfirst.mapzen.utils>=0.29',
        'whosonfirst.mapzen.search>=0.17',
        'whosonfirst.mapzen.placetypes>=0.14',
        'whosonfirst.mapzen.sources>=0.063',
        'whosonfirst.mapzen.uri>=0.01',
        ],
    dependency_links=[
        'https://github.com/whosonfirst/py-machinetag/tarball/master#egg=machinetag-1.4',
        'https://github.com/whosonfirst/py-machinetag-elasticsearch/tarball/master#egg=machinetag.elasticsearch-0.3',
        'https://github.com/whosonfirst/py-machinetag-mapzen-whosonfirst-utils/tarball/master#egg=mapzen.whosonfirst.utils-0.29',
        'https://github.com/whosonfirst/py-mapzen-whosonfirst-search/tarball/master#egg=mapzen.whosonfirst.search-0.17',
        'https://github.com/whosonfirst/py-mapzen-whosonfirst-placetypes/tarball/master#egg=mapzen.whosonfirst.placetypes-0.14',
        'https://github.com/whosonfirst/py-mapzen-whosonfirst-sources/tarball/master#egg=mapzen.whosonfirst.sources-0.063',
        'https://github.com/whosonfirst/py-mapzen-whosonfirst-uri/tarball/master#egg=mapzen.whosonfirst.uri-0.1',
        ],
    license='BSD')


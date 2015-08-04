#!/usr/bin/env python

import sys
import logging
import urlparse
import urllib

import flask
import werkzeug
import werkzeug.security
from werkzeug.contrib.fixers import ProxyFix

import math
import json

# neither of these are properly namespaced/installable yet
# (20150730/thisisaaronland)

import mapzen.whosonfirst.spatial as spatial
import mapzen.whosonfirst.search as search

# create lookup/db thingy here
# create search/db thingy here

pg_search = None
es_search = None

app = flask.Flask('SPELUNKER')
app.wsgi_app = ProxyFix(app.wsgi_app)

logging.basicConfig(level=logging.INFO)

@app.before_request
def init():

    spatial_dsn = os.environ.get('WOF_SPATIAL_DSN', None)
    spatial_db = spatial.query(query_dsn)

    flask.g.spatial_db = spatial_db

    search_idx = search.query()
    flask.g.search_idx = search_idx

@app.route("/id/<id>")
@app.route("/id/<id>/")
def info(id):

    query = {
        'ids': {
            'values': [id]
        }
    }
    
    body = {
        'query': query
    }

    rsp = flask.g.search_idx.query(body)

    docs = rsp['rows']
    doc = docs[0]

    return flask.render_template('id.html', doc=doc)

@app.route("/")
@app.route("/search")
@app.route("/search/")
def search():

    q = flask.request.args.get('q')

    if not q:
        return flask.render_template('search_form.html')
    
    args = {}

    page = flask.request.args.get('page')

    if page:
        page = int(page)
        args['page'] = page

    if page:
        args['page'] = page

    placetype = flask.request.args.get('placetype')
    
    query = {
        'query_string': {
            'query': q
        }
    }
    
    body = {
        'query': query
    }
    
    rsp = flask.g.search_idx.query(body, **args)

    pagination = rsp['pagination']
    docs = rsp['rows']
    
    qs = flask.request.query_string
    qs = dict(urlparse.parse_qsl(qs))

    if qs.get('page', False):
        del(qs['page'])

    qs = urllib.urlencode(qs)

    pagination_url = "https://%s%s?%s" % (flask.request.host, flask.request.path, qs)

    return flask.render_template('search_results.html', docs=docs, pagination=pagination, pagination_url=pagination_url, query=q)

if __name__ == '__main__':

    import sys
    import optparse
    import ConfigParser

    opt_parser = optparse.OptionParser()

    opt_parser.add_option('-p', '--port', dest='port', action='store', default=7777, help='')
    opt_parser.add_option('-c', '--config', dest='config', action='config', default=None, help='')

    opt_parser.add_option('-v', '--verbose', dest='verbose', action='store_true', default=False, help='Be chatty (default is false)')
    options, args = opt_parser.parse_args()

    if options.verbose:	
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)

    cfg = ConfigParser.ConfigParser()
    cfg.read(options.config)

    dsn = spatial.cfg2dsn(cfg, 'whosonfirst')
    os.environ['WOF_SPATIAL_DSN'] = dsn

    port = int(options.port)
    app.run(port=port)

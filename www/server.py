#!/usr/bin/env python

import sys
import os
import logging
import urlparse
import urllib

import flask
import werkzeug
import werkzeug.security
from werkzeug.contrib.fixers import ProxyFix

import math
import json

import mapzen.whosonfirst.spatial as spatial
import mapzen.whosonfirst.search as search

app = flask.Flask('SPELUNKER')
app.wsgi_app = ProxyFix(app.wsgi_app)

logging.basicConfig(level=logging.INFO)

@app.before_request
def init():

    spatial_dsn = os.environ.get('WOF_SPATIAL_DSN', None)
    spatial_db = spatial.query(spatial_dsn)

    search_host = os.environ.get('WOF_SEARCH_HOST', None)
    search_port = os.environ.get('WOF_SEARCH_PORT', None)

    search_idx = search.query(host=search_host, port=search_port)

    flask.g.spatial_db = spatial_db
    flask.g.search_idx = search_idx

@app.route("/id/<id>")
@app.route("/id/<id>/")
def info(id):

    doc = get_by_id(id)
    return flask.render_template('id.html', doc=doc)

@app.route("/id/<id>/descendants")
@app.route("/id/<id>/descendants/")
def descendants(id):

    doc = get_by_id(id)

    query = {
        'term': {
            'wof:belongsto': id
        }
    }
    
    body = {
        'query': query
    }

    placetype = flask.request.args.get('placetype', None)

    if placetype:

        filter = {
            'term': { 'wof:placetype': placetype }
        }

        body['filter'] = filter

    args = {}

    page = flask.request.args.get('page')

    if page:
        page = int(page)
        args['page'] = page

    if page:
        args['page'] = page

    rsp = flask.g.search_idx.search(body, **args)

    docs = rsp['rows']
    pagination = rsp['pagination']

    # facets

    aggrs = {
        'placetypes': {
            'terms': {
                'field': 'wof:placetype',
            }
        }
    }
        
    body = {
        'query': query,
        'aggregations': aggrs,
    }

    query_str = { 
        'search_type': 'count'
    }

    args = { 'body': body, 'query': query_str }
    rsp = flask.g.search_idx.search_raw(**args)

    aggregations = rsp.get('aggregations', {})
    results = aggregations.get('placetypes', {})
    
    facets = {
        'placetypes': results.get('buckets', [])
    }

    pagination_url = build_pagination_url()

    return flask.render_template('descendants.html', docs=docs, pagination=pagination, pagination_url=pagination_url, facets=facets, doc=doc)

@app.route("/placetypes")
@app.route("/placetypes/")
def placetypes():
    
    aggrs = {
        'placetypes': {
            'terms': {
                'field': 'wof:placetype',
            }
        }
    }
        
    body = {
        'aggregations': aggrs,
    }

    query = { 
        'search_type': 'count'
    }

    args = { 'body': body, 'query': query }
    rsp = flask.g.search_idx.search_raw(**args)

    aggregations = rsp.get('aggregations', {})
    results = aggregations.get('placetypes', {})
    buckets = results.get('buckets', [])

    return flask.render_template('placetypes.html', placetypes=buckets)

@app.route("/placetypes/<placetype>")
@app.route("/placetypes/<placetype>/")
def placetype(placetype):

    query = {
        'term': {
            'wof:placetype': placetype
        }
    }
    
    body = {
        'query': query,
    }

    iso = flask.request.args.get('iso', None)

    if iso:
        iso = iso.lower()

        filter = {
            'term': { 'iso:country': iso }
        }

        body['filter'] = filter

    args = {}

    page = flask.request.args.get('page')

    if page:
        page = int(page)
        args['page'] = page

    if page:
        args['page'] = page

    rsp = flask.g.search_idx.search(body, **args)

    pagination = rsp['pagination']
    docs = rsp['rows']

    # facets

    aggrs = {
        'countries': {
            'terms': {
                'field': 'iso:country',
                'size': 0
            }
        }
    }

    body = {
        'query': query,
        'aggregations': aggrs,
    }

    query_str = { 
        'search_type': 'count',
    }

    args = { 'body': body, 'query': query_str }
    rsp = flask.g.search_idx.search_raw(**args)

    aggregations = rsp.get('aggregations', {})
    countries = aggregations.get('countries', {})

    facets = {
        'countries': countries.get('buckets', []),
    }

    pagination_url = build_pagination_url()

    return flask.render_template('placetype.html', placetype=placetype, docs=docs, pagination=pagination, pagination_url=pagination_url, facets=facets)

@app.route("/")
@app.route("/search")
@app.route("/search/")
def searchify():

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
    
    query = {
        'query_string': {
            'query': q
        }
    }

    filters = []

    placetype = flask.request.args.get('placetype', None)
    iso = flask.request.args.get('iso', None)

    if placetype:
        filters.append({ 'term': { 'wof:placetype' : placetype } })

    if iso:
        iso = iso.lower()
        filters.append({ 'term': { 'iso:country' : iso } })

    # oh elasticsearch... Y U MOON LANGUAGE?
    # https://github.com/elastic/elasticsearch/issues/1688#issuecomment-5415536

    if len(filters):

        body = {
            'query': {
                'filtered': {
                    'query': query,
                    'filter': { 'and': filters }
                }
            }
        }

    else:
        
        body = { 'query': query }

    rsp = flask.g.search_idx.search(body, **args)

    pagination = rsp['pagination']
    docs = rsp['rows']

    # facet

    aggrs = {
        'placetypes': {
            'terms': {
                'field': 'wof:placetype',
                'size': 0
            }
        },
        'countries': {
            'terms': {
                'field': 'iso:country',
                'size': 0
            }
        }
    }
        
    body = {
        'query': query,
        'aggregations': aggrs,
    }

    query_str = { 
        'search_type': 'count'
    }

    args = { 'body': body, 'query': query_str }
    rsp = flask.g.search_idx.search_raw(**args)

    aggregations = rsp.get('aggregations', {})
    placetypes = aggregations.get('placetypes', {})
    countries = aggregations.get('countries', {})

    facets = {
        'placetypes': placetypes.get('buckets', []),
        'countries': countries.get('buckets', []),
    }

    #

    pagination_url = build_pagination_url()

    return flask.render_template('search_results.html', docs=docs, pagination=pagination, pagination_url=pagination_url, query=q, facets=facets)

def build_pagination_url():

    qs = flask.request.query_string
    qs = dict(urlparse.parse_qsl(qs))

    if qs.get('page', False):
        del(qs['page'])

    qs = urllib.urlencode(qs)

    return "https://%s%s?%s" % (flask.request.host, flask.request.path, qs)

def get_by_id(id):

    query = {
        'ids': {
            'values': [id]
        }
    }
    
    body = {
        'query': query
    }

    rsp = flask.g.search_idx.search(body)

    docs = rsp['rows']
    return docs[0]

if __name__ == '__main__':

    import sys
    import optparse
    import ConfigParser

    opt_parser = optparse.OptionParser()

    opt_parser.add_option('-p', '--port', dest='port', action='store', default=7777, help='')
    opt_parser.add_option('-c', '--config', dest='config', action='store', default=None, help='')
    opt_parser.add_option('-v', '--verbose', dest='verbose', action='store_true', default=False, help='Be chatty (default is false)')

    options, args = opt_parser.parse_args()

    if options.verbose:	
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)

    cfg = ConfigParser.ConfigParser()
    cfg.read(options.config)

    dsn = spatial.cfg2dsn(cfg, 'spatial')
    os.environ['WOF_SPATIAL_DSN'] = dsn

    os.environ['WOF_SEARCH_HOST'] = cfg.get('search', 'host')
    os.environ['WOF_SEARCH_PORT'] = cfg.get('search', 'port')

    port = int(options.port)
    app.run(port=port)

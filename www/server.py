#!/usr/bin/env python

import sys
import os
import logging
import urlparse
import urllib
import codecs

import flask
import werkzeug
import werkzeug.security
from werkzeug.contrib.fixers import ProxyFix

import types
import math
import json

import mapzen.whosonfirst.spatial as spatial
import mapzen.whosonfirst.search as search
import mapzen.whosonfirst.placetypes as pt

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

# http://flask.pocoo.org/snippets/29/

@app.template_filter()
def number_format(value, tsep=',', dsep='.'):

    s = unicode(value)

    cnt = 0
    numchars = dsep + '0123456789'

    ls = len(s)

    while cnt < ls and s[cnt] not in numchars:
        cnt += 1

    lhs = s[:cnt]
    s = s[cnt:]

    if not dsep:
        cnt = -1
    else:
        cnt = s.rfind(dsep)

    if cnt > 0:
        rhs = dsep + s[cnt+1:]
        s = s[:cnt]
    else:
        rhs = ''

    splt = ''

    while s != '':
        splt = s[-3:] + tsep + splt
        s = s[:-3]

    return lhs + splt[:-1] + rhs

@app.route("/", methods=["GET"])
def index():

    return flask.render_template('index.html')

@app.route("/id/<int:id>", methods=["GET"])
@app.route("/id/<int:id>/", methods=["GET"])
def info(id):

    doc = get_by_id(id)
    
    if not doc:
        logging.warning("no record for ID %s" % id)
        flask.abort(404)

    hiers = inflate_hierarchy(doc)

    template_args = {
        'doc': doc,
        'hierarchies': hiers
    }

    return flask.render_template('id.html', **template_args)

@app.route("/id/<int:id>/descendants", methods=["GET"])
@app.route("/id/<int:id>/descendants/", methods=["GET"])
def descendants(id):

    doc = get_by_id(id)

    if not doc:
        logging.warning("no record for ID %s" % id)
        flask.abort(404)

    query = {
        'term': {
            'wof:belongsto': doc.get('id')
        }
    }
    
    sort = [
        { 'wof:name' : 'asc' }
    ]

    body = {
        'sort': sort,
        'query': query
    }

    placetype = get_str('placetype')

    if placetype:

        if not pt.is_valid_placetype(placetype):
            logging.warning("invalid placetype %s" % placetype)
            flask.abort(404)

        placetype = pt.placetype(placetype)
        placetype_id = placetype.id()

        filter = {
            'term': { 'wof:placetype_id': placetype_id }
        }

        body['filter'] = filter

    args = {}

    page = get_int('page')

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
                'size': 0,
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
    facet_url = pagination_url

    template_args = {
        'docs': docs,
        'pagination': pagination,
        'pagination_url': pagination_url,
        'facets': facets,
        'facet_url': facet_url,
        'doc': doc
    }

    return flask.render_template('descendants.html', **template_args)

@app.route("/megacities", methods=["GET"])
@app.route("/megacities/", methods=["GET"])
def megacities():

    query = {
        'term': {
            'wof:megacity': '1'
        }
    }

    query = enfilterify(query)

    sort = [
        { 'gn:population': {'order': 'desc', 'mode': 'max'} },
        { 'geom:area': {'order': 'desc', 'mode': 'max'} },
    ]

    body = {
        'query': query,
        'sort': sort
    }

    args = {}

    page = get_int('page')

    if page:
        args['page'] = page

    rsp = flask.g.search_idx.search(body, **args)
    pagination = rsp['pagination']
    docs = rsp['rows']

    facets = facetify(query)

    pagination_url = build_pagination_url()
    facet_url = pagination_url

    template_args = {
        'docs': docs,
        'pagination': pagination,
        'facets': facets,
        'facet_url': facet_url,
        'pagination_url': pagination_url,
    }

    return flask.render_template('megacities.html', **template_args)


@app.route("/placetypes", methods=["GET"])
@app.route("/placetypes/", methods=["GET"])
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

@app.route("/placetypes/<placetype>", methods=["GET"])
@app.route("/placetypes/<placetype>/", methods=["GET"])
def placetype(placetype):

    placetype = sanitize_str(placetype)

    if not pt.is_valid_placetype(placetype):
        flask.abort(404)

    placetype = pt.placetype(placetype)
    placetype_id = placetype.id()

    query = {
        'term': {
            'wof:placetype_id': placetype_id
        }
    }

    query = enfilterify(query)
    
    body = {
        'query': query,
    }

    args = {}

    page = get_int('page')

    if page:
        args['page'] = page

    rsp = flask.g.search_idx.search(body, **args)

    pagination = rsp['pagination']
    docs = rsp['rows']

    facets = facetify(query)
    
    pagination_url = build_pagination_url()
    facet_url = pagination_url

    template_args = {
        'placetype': placetype,
        'docs': docs,
        'pagination': pagination,
        'pagination_url': pagination_url,
        'facets': facets,
        'facet_url': facet_url
    }

    return flask.render_template('placetype.html', **template_args)

@app.route("/search", methods=["GET"])
@app.route("/search/", methods=["GET"])
def searchify():

    q = get_str('q')

    if not q or q == '':
        return flask.render_template('search_form.html')
    
    esc_q = flask.g.search_idx.escape(q)

    query = {
        'query_string': {
            'query': esc_q
        }
    }

    query = enfilterify(query)

    sort = [
        { 'wof:megacity' : {'order': 'desc', 'mode': 'max' } },
        { 'gn:population' : {'order': 'desc', 'mode': 'max' } },
        { 'wof:name' : {'order': 'desc' } },
        { 'wof:scale' : {'order': 'desc', 'mode': 'max' } },
        { 'geom:area': {'order': 'desc', 'mode': 'max'} },
    ]

    # TO DO: boost wof:name and name fields

    body = {
        'query': query,
        'sort': sort,
    }

    args = {}

    page = get_int('page')

    if page:
        args['page'] = page

    rsp = flask.g.search_idx.search(body, **args)

    pagination = rsp['pagination']
    docs = rsp['rows']

    facets = facetify(query)

    pagination_url = build_pagination_url()
    facet_url = pagination_url

    template_args = {
        'docs': docs,
        'pagination': pagination,
        'pagination_url': pagination_url,
        'query': q,
        'facets': facets,
        'facet_url': facet_url,
    }

    return flask.render_template('search_results.html', **template_args)

def facetify(query):

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
        },
        'tags': {
            'terms': {
                'field': 'sg:tags',
                'size': 0
            }
        },
        'categories': {
            'terms': {
                'field': 'category',	# as in sg:classfiers.category
                'size': 0
            }
        },
        'localities': {
            'terms': {
                'field': 'locality_id',
                'size': 10
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

    facets = {}

    for k, ignore in aggrs.items():
        results = aggregations.get(k, {})
        results = results.get('buckets', [])
        facets[k] = results

    return facets

def enfilterify(query):

    filters = []

    placetype = get_str('placetype')
    iso = get_str('iso')
    tag = get_str('tag')

    if placetype:

        if not pt.is_valid_placetype(placetype):
            logging.warning("invalid placetype %s" % placetype)
            flask.abort(404)

        placetype = pt.placetype(placetype)
        placetype_id = placetype.id()

        filters.append({ 'term': {
            'wof:placetype_id' : placetype_id
        }})

    if iso:

        iso = iso.lower()
        esc_iso = flask.g.search_idx.escape(iso)

        filters.append({ 'term': {
            'iso:country' : esc_iso
        }})

    if tag:

        esc_tag = flask.g.search_idx.escape(tag)

        filters.append({ 'term': {
            'sg:tags' : esc_tag
        }})

    # oh elasticsearch... Y U MOON LANGUAGE?
    # https://github.com/elastic/elasticsearch/issues/1688#issuecomment-5415536

    if len(filters):

        query = {
            'filtered': {
                'query': query,
                'filter': { 'and': filters }
                }
        }

    return query

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

    try:
        return docs[0]
    except Exception, e:
        print "failed to retrieve %s" % id
        return None

def inflate_hierarchy(doc):

    props = doc.get('properties', {})

    hierarchies = props.get('wof:hierarchy', [])
    hiers = []

    for hier in hierarchies:

        inflated = {}

        for rel, id in hier.items():

            if id == props['wof:id']:
                continue

            rel = rel.replace("_id", "")
            inflated[rel] = get_by_id(id)

        hiers.append(inflated)

    return hiers

# please put me in a library somewhere...
# please to be porting this at the same time...
# https://github.com/exflickr/flamework/blob/master/www/include/lib_sanitize.php
# (20150831/thisisaaronland)

def get_str(k):

    str = flask.request.args.get(k, None)
    return sanitize_str(str)

def get_int(k):

    i = flask.request.args.get(k, None)
    return sanitize_int(i)

def sanitize_str(str):

    if str:
        str = codecs.encode(str, 'utf-8')
        str = str.strip()

    return str
    
def sanitize_int(i):

    if i:
        i = int(i)

    return i

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

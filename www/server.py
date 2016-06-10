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

import re
import time
import random
import types
import math
import json
import pycountry

import mapzen.whosonfirst.utils as utils
import mapzen.whosonfirst.search as search
import mapzen.whosonfirst.placetypes as pt
import mapzen.whosonfirst.sources as src
import mapzen.whosonfirst.uri as uri

# import mapzen.whosonfirst.spatial as spatial

# http://flask.pocoo.org/snippets/35/

class ReverseProxied(object):
    '''Wrap the application in this middleware and configure the 
    front-end server to add these headers, to let you quietly bind 
    this to a URL other than / and to an HTTP scheme that is 
    different than what is used locally.

    In nginx:
    location /myprefix {
        proxy_pass http://192.168.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Scheme $scheme;
        proxy_set_header X-Script-Name /myprefix;
        }

    :param app: the WSGI application
    '''
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        script_name = environ.get('HTTP_X_SCRIPT_NAME', '')
        if script_name:
            environ['SCRIPT_NAME'] = script_name
            path_info = environ['PATH_INFO']
            if path_info.startswith(script_name):
                environ['PATH_INFO'] = path_info[len(script_name):]

        scheme = environ.get('HTTP_X_SCHEME', '')
        if scheme:
            environ['wsgi.url_scheme'] = scheme
        return self.app(environ, start_response)

app = flask.Flask('SPELUNKER')
app.wsgi_app = ProxyFix(app.wsgi_app)
app.wsgi_app = ReverseProxied(app.wsgi_app)

logging.basicConfig(level=logging.INFO)

@app.before_request
def init():

    # See this - yeah, like that. Maybe one day again but
    # for now it just makes everything fussy and complicated
    # specifically because we don't actually use it anywhere
    # (20160201/thisisaaronland)

    """
    spatial_dsn = os.environ.get('WOF_SPATIAL_DSN', None)
    spatial_db = spatial.query(spatial_dsn)
    flask.g.spatial_db = spatial_db
    """

    search_host = os.environ.get('WOF_SEARCH_HOST', None)
    search_port = os.environ.get('WOF_SEARCH_PORT', None)

    search_idx = search.query(host=search_host, port=search_port)
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

@app.route("/about", methods=["GET"])
@app.route("/about/", methods=["GET"])
@app.route("/faq", methods=["GET"])
@app.route("/faq/", methods=["GET"])
@app.route("/help", methods=["GET"])
@app.route("/help/", methods=["GET"])
def about():

    return flask.render_template('about.html')

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

@app.route("/id/<int:id>.geojson", methods=["GET"])
def geojson(id):

    doc = get_by_id(id)

    if not doc:
        logging.warning("no record for ID %s" % id)
        flask.abort(404)

    # strictly speaking we should make the root URL a config thingy
    # but not today... (20160607/thisisaaronland)

    location = uri.id2abspath('https://whosonfirst.mapzen.com/data', id)
    return flask.redirect(location, code=303)

@app.route("/random", methods=["GET"])
@app.route("/random/", methods=["GET"])
def random_place():

    now = time.time()
    now = int(now)

    seed = random.randint(0, now)

    query = {
        'function_score': {
            'query': {
                'match_all' : { }
            },
            'functions': [
                { 'random_score': { 'seed': seed } }
            ]
        }
    }

    body = { 'query': query }
    args = { 'per_page': 1 }

    rsp = flask.g.search_idx.search(body, **args)
    docs = rsp['rows']

    try:
        doc = docs[0]
    except Exception, e:
        logging.error("failed to get random document")
        flask.abort(404)        

    id = doc['id']
    url = flask.url_for('info', id=id)

    logging.debug("redirect random to %s" % url)
    return flask.redirect(url)

@app.route("/brands", methods=["GET"])
@app.route("/brands/", methods=["GET"])
def brands():

    aggrs = {
        'brands': {
            'terms': {
                'field': 'wof:brand_id',
                'size': 0,
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
    results = aggregations.get('brands', {})
    buckets = results.get('buckets', [])

    return flask.render_template('brands.html', brands=buckets)

@app.route("/brands/<int:id>", methods=["GET"])
@app.route("/brands/<int:id>/", methods=["GET"])
def brand(id):

    brand_id = sanitize_int(id)

    query = {
        'term': {
            'wof:brand_id': brand_id
        }
    }

    query = enfilterify(query)
    
    body = {
        'query': query,
    }

    args = {'per_page': 50}

    page = get_int('page')
    page = get_single(page)

    if page:
        args['page'] = page

    rsp = flask.g.search_idx.search(body, **args)

    pagination = rsp['pagination']
    docs = rsp['rows']

    facets = facetify(query)
    
    pagination_url = build_pagination_url()
    facet_url = pagination_url

    template_args = {
        'es_query': body,
        'brand': brand_id,
        'docs': docs,
        'pagination': pagination,
        'pagination_url': pagination_url,
        'facets': facets,
        'facet_url': facet_url
    }

    return flask.render_template('brand.html', **template_args)

@app.route("/languages", methods=["GET"])
@app.route("/languages/", methods=["GET"])
def languages_official():
    return languages()

@app.route("/languages/spoken", methods=["GET"])
@app.route("/languages/spoken/", methods=["GET"])
def languages_spoken():
    return languages(True)

def languages(spoken=False):

    field = "wof:lang_x_official"

    if spoken:
        field = "wof:lang_x_spoken"

    # field = 'wof:lang'

    aggrs = {
        'languages': {
            'terms': {
                'field': field,
                'size': 0,
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
    results = aggregations.get('languages', {})
    buckets = results.get('buckets', [])

    for b in buckets:

        try:
            lang = pycountry.languages.get(iso639_3_code=b['key'])
            b['lang_common'] = lang.name
        except Exception, e:
            b['lang_common'] = b['key']

    template = "languages_official.html"

    if spoken:
        template = "languages_spoken.html"

    return flask.render_template(template, languages=buckets)

@app.route("/languages/<string:lang>", methods=["GET"])
@app.route("/languages/<string:lang>/", methods=["GET"])
def for_lang_official(lang):
    return has_language(lang)

@app.route("/languages/spoken/<string:lang>", methods=["GET"])
@app.route("/languages/spoken/<string:lang>/", methods=["GET"])
@app.route("/languages/<string:lang>/spoken", methods=["GET"])
@app.route("/languages/<string:lang>/spoken/", methods=["GET"])
def for_lang_spoken(lang):
    return has_language(lang, True)

@app.route("/concordances/", methods=["GET"])
@app.route("/concordances/", methods=["GET"])
def concordances():

    aggrs = {
        'concordances': {

            'terms': {
                'field': 'wof:concordances_sources',
                'size': 0,
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
    results = aggregations.get('concordances', {})
    buckets = results.get('buckets', [])

    for b in buckets:

        prefix, key = b['key'].split(':')

        source = src.get_source_by_prefix(prefix)
        
        b['prefix'] = prefix

        if source:
            b['fullname'] = source.details['fullname']
            b['name'] = source.details['name']
        else:
            b['fullname'] = prefix
            b['name'] = prefix

    count_concordances = len(buckets)

    return flask.render_template('concordances.html', concordances=buckets, count_concordances=count_concordances)

@app.route("/concordances/<string:who>", methods=["GET"])
@app.route("/concordances/<string:who>/", methods=["GET"])
def for_concordance(who):

    who = sanitize_str(who)
    source = None

    if not source:
        source = src.get_source_by_name(who)
    
    if not source:
        source = src.get_source_by_prefix(who)

    if not source:
        flask.abort(404)

    lookup = source.lookup_key()
    fullname = source.details['fullname']

    return has_concordance(lookup, fullname)

@app.route("/geonames/", methods=["GET"])
@app.route("/gn/", methods=["GET"])
def for_geonames():
    location = flask.url_for('for_concordance', who='geonames')
    return flask.redirect(location, code=301)

@app.route("/geoplanet/", methods=["GET"])
@app.route("/gp/", methods=["GET"])
@app.route("/woe", methods=["GET"])
@app.route("/woe/", methods=["GET"])
def for_geoplanet():
    location = flask.url_for('for_concordance', who='geoplanet')
    return flask.redirect(location, code=301)
    
@app.route("/tgn/", methods=["GET"])
def for_tgn():
    location = flask.url_for('for_concordance', who='tgn')
    return flask.redirect(location, code=301)

@app.route("/wikidata/", methods=["GET"])
@app.route("/wd/", methods=["GET"])
def for_wikidata():
    location = flask.url_for('for_concordance', who='wikidata')
    return flask.redirect(location, code=301)

# Please update all the 'info_concordance' stuff as follows
# https://github.com/whosonfirst/whosonfirst-www-spelunker/issues/25

@app.route("/geoplanet/id/<int:id>", methods=["GET"])
@app.route("/geoplanet/id/<int:id>/", methods=["GET"])
@app.route("/woe/id/<int:id>", methods=["GET"])
@app.route("/woe/id/<int:id>/", methods=["GET"])
def info_geoplanet(id):
    return info_concordance(id, 'gp:id')

@app.route("/geonames/id/<int:id>", methods=["GET"])
@app.route("/geonames/id/<int:id>/", methods=["GET"])
def info_geonames(id):
    return info_concordance(id, 'gn:id')

@app.route("/quattroshapes/id/<int:id>", methods=["GET"])
@app.route("/quattroshapes/id/<int:id>/", methods=["GET"])
def info_quattroshapes(id):
    return info_concordance(id, 'qs:id')

@app.route("/factual/id/<id>", methods=["GET"])
@app.route("/factual/id/<id>/", methods=["GET"])
def info_factual(id):
    return info_concordance(id, 'fct:id')

@app.route("/simplegeo/id/<id>", methods=["GET"])
@app.route("/simplegeo/id/<id>/", methods=["GET"])
@app.route("/sg/id/<id>", methods=["GET"])
@app.route("/sg/id/<id>/", methods=["GET"])
def info_simplegeo(id):
    return info_concordance(id, 'sg:id')

@app.route("/faa/id/<id>", methods=["GET"])
@app.route("/faa/id/<id>/", methods=["GET"])
def info_faa(id):
    return info_concordance(id, 'faa:code')

@app.route("/iata/id/<id>", methods=["GET"])
@app.route("/iata/id/<id>/", methods=["GET"])
def info_iata(id):
    return info_concordance(id, 'iata:code')

@app.route("/icao/id/<id>", methods=["GET"])
@app.route("/icao/id/<id>/", methods=["GET"])
def info_icao(id):
    return info_concordance(id, 'icao:code')

@app.route("/ourairports/id/<int:id>", methods=["GET"])
@app.route("/ourairports/id/<int:id>/", methods=["GET"])
def info_ourairports(id):
    return info_concordance(id, 'oa:id')

def info_concordance(id, src):

    if type(id) == types.IntType:
        id = sanitize_int(id)
    else:
        id = sanitize_str(id)
        id = flask.g.search_idx.escape(id)
        
    doc = get_by_concordance(id, src)

    if not doc:
        logging.warning("no record for ID %s" % id)
        flask.abort(404)

    # Maybe redirect instead?
    # (21050908/thisisaaronland)

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

    query = enfilterify(query)
    
    sort = [
        { 'wof:name' : 'asc' }
    ]

    body = {
        'sort': sort,
        'query': query
    }

    args = {'per_page': 50}

    page = get_int('page')
    page = get_single(page)

    if page:
        args['page'] = page

    rsp = flask.g.search_idx.search(body, **args)

    docs = rsp['rows']
    pagination = rsp['pagination']

    facets = facetify(query)

    pagination_url = build_pagination_url()
    facet_url = pagination_url

    template_args = {
        'doc': doc,
        'docs': docs,
        'pagination': pagination,
        'pagination_url': pagination_url,
        'facets': facets,
        'facet_url': facet_url,
        'es_query': body,
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

    args = {'per_page': 50}

    page = get_int('page')
    page = get_single(page)

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
        'es_query': body,
    }

    return flask.render_template('megacities.html', **template_args)


@app.route("/placetypes", methods=["GET"])
@app.route("/placetypes/", methods=["GET"])
def placetypes():
    
    aggrs = {
        'placetypes': {
            'terms': {
                'field': 'wof:placetype',
                'size': 0,
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

    total_count = 0

    for b in buckets:
        total_count += b['doc_count']

    return flask.render_template('placetypes.html', placetypes=buckets, total_count=total_count)

@app.route("/placetypes/<placetype>", methods=["GET"])
@app.route("/placetypes/<placetype>/", methods=["GET"])
def placetype(placetype):

    placetype = sanitize_str(placetype)

    if not pt.is_valid_placetype(placetype):
        flask.abort(404)

    # Because this: https://github.com/whosonfirst/py-mapzen-whosonfirst-search/issues/4
    # (20151028/thisisaaronland)

    query = {
        'term': {
            'wof:placetype': placetype
        }
    }

    # For good time, see above...
    # (20151028/thisisaaronland)

    """
    placetype = pt.placetype(placetype)
    placetype_id = placetype.id()

    query = {
        'term': {
            'wof:placetype_id': placetype_id
        }
    }
    """

    query = enfilterify(query)
    
    body = {
        'query': query,
    }

    args = {'per_page': 50}

    page = get_int('page')
    page = get_single(page)

    if page:
        args['page'] = page

    rsp = flask.g.search_idx.search(body, **args)

    pagination = rsp['pagination']
    docs = rsp['rows']

    facets = facetify(query)
    
    pagination_url = build_pagination_url()
    facet_url = pagination_url

    template_args = {
        'es_query': body,
        'placetype': placetype,
        'docs': docs,
        'pagination': pagination,
        'pagination_url': pagination_url,
        'facets': facets,
        'facet_url': facet_url
    }

    return flask.render_template('placetype.html', **template_args)

@app.route("/mt", methods=["GET"])
@app.route("/mt/", methods=["GET"])
def mt_hier():
    buckets = machinetag_hierarchies('xx:categories')
    return flask.render_template('mt.html', mt=buckets, whatami='Hierarchies')

@app.route("/mt/hierarchy/namespaces", methods=["GET"])
@app.route("/mt/hierarchy/namespaces/", methods=["GET"])
def mt_hier_ns():
    buckets = machinetag_hierarchies('xx:categories', filter='namespaces')
    return flask.render_template('mt.html', mt=buckets, whatami='Namespaces')

@app.route("/mt/hierarchy/namespaces/<string:ns>", methods=["GET"])
@app.route("/mt/hierarchy/namespaces/<string:ns>/", methods=["GET"])
def mt_hier_ns_pred(ns):
    buckets = machinetag_hierarchies('xx:categories', filter='predicates', namespace=ns)
    return flask.render_template('mt.html', mt=buckets, whatami='Predicates for ...')

@app.route("/mt/hierarchy/predicates", methods=["GET"])
@app.route("/mt/hierarchy/predicates/", methods=["GET"])
def mt_hier_pred():
    buckets = machinetag_hierarchies('xx:categories', filter='predicates')
    return flask.render_template('mt.html', mt=buckets, whatami='Predicates')

@app.route("/mt/hierarchy/predicates/<string:pred>", methods=["GET"])
@app.route("/mt/hierarchy/predicates/<string:pred>/", methods=["GET"])
def mt_hier_pred_value(pred):
    buckets = machinetag_hierarchies('xx:categories', filter='values', predicate=pred)
    return flask.render_template('mt.html', mt=buckets, whatami='Values for ...')

@app.route("/mt/hierarchy/values", methods=["GET"])
@app.route("/mt/hierarchy/values/", methods=["GET"])
def mt_hier_value():
    buckets = machinetag_hierarchies('xx:categories', filter='values')
    return flask.render_template('mt.html', mt=buckets, whatami='Values')

@app.route("/mt/<string:ns>/*/<string:value>", methods=["GET"])
@app.route("/mt/<string:ns>/*/<string:value>/", methods=["GET"])
def mt_values(ns, value):
    buckets = machinetag_hierarchies('xx:categories', filter='predicates', namespace=ns, value=value)
    return flask.render_template('mt.html', mt=buckets, whatami='Predicates for ...')

@app.route("/mt/*/<string:pred>/<string:value>", methods=["GET"])
@app.route("/mt/*/<string:pred>/<string:value>/", methods=["GET"])
def mt_ns_for_pred_value(pred, value):
    buckets = machinetag_hierarchies('xx:categories', filter='namespaces', predicate=pred, value=value)
    return flask.render_template('mt.html', mt=buckets, whatami='Namespaces for ...')

@app.route("/mt/<string:ns>", methods=["GET"])
@app.route("/mt/<string:ns>/", methods=["GET"])
def mt_ns(ns):
    buckets = machinetag_hierarchies('xx:categories', filter='predicates', namespace=ns)
    return flask.render_template('mt.html', mt=buckets, whatami='Predicates for ...')

@app.route("/mt/<string:ns>/<string:pred>", methods=["GET"])
@app.route("/mt/<string:ns>/<string:pred>/", methods=["GET"])
def mt_ns_pred(ns, pred):
    buckets = machinetag_hierarchies('xx:categories', filter='values', namespace=ns, predicate=pred)
    return flask.render_template('mt.html', mt=buckets, whatami='Values for ...')

# @app.route("/mt/<string:ns>/<string:pred>/<string:value>", methods=["GET"])
# @app.route("/mt/<string:ns>/<string:pred>/<string:value>/", methods=["GET"])
# def mt_ns_pred_value(ns, pred, value):
#     pass

def machinetag_hierarchies(field, **kwargs):

    # https://stackoverflow.com/questions/24819234/elasticsearch-using-the-path-hierarchy-tokenizer-to-access-different-level-of
    # https://www.elastic.co/guide/en/elasticsearch/reference/1.7/search-aggregations-bucket-terms-aggregation.html
    # https://github.com/whosonfirst/py-mapzen-whosonfirst-machinetag/blob/master/mapzen/whosonfirst/machinetag/__init__.py

    aggrs = {
        'hierarchies': {
            'terms': {
                'field': field,
                'size': 0,
            }
        }
    }

    def sort_filtered(raw):

        sorted = []
        tmp = {}

        for b in raw:
            key = b['key']
            count = b['doc_count']

            bucket = tmp.get(count, [])
            bucket.append(key)

            tmp[count] = bucket

        counts = tmp.keys()
        counts.sort()
        counts.reverse()

        for count in counts:
            for key in tmp[count]:
                sorted.append({'doc_count': count, 'key': key })

        return sorted

    def filter_namespaces(raw):

        filtered = []
        tmp = {}

        predicates = {}
        values = {}

        for b in raw:
            key = b['key']
            count = b['doc_count']

            key = key.split(".")
            ns = key[0]

            total = tmp.get(ns, 0)
            total += count

            tmp[ns] = total

        for pred, count in tmp.items():
            filtered.append({'doc_count': count, 'key': pred})

        return sort_filtered(filtered)

    def filter_predicates(raw):

        filtered = []
        tmp = {}

        for b in raw:
            key = b['key']
            count = b['doc_count']

            key = key.split(".")
            pred = key[1]

            total = tmp.get(pred, 0)
            total += count

            tmp[pred] = total

        for pred, count in tmp.items():
            filtered.append({'doc_count': count, 'key': pred})

        return sort_filtered(filtered)

    def filter_values(raw):

        filtered = []
        tmp = {}

        for b in raw:
            key = b['key']
            count = b['doc_count']

            key = key.split(".")
            value = key[2]

            total = tmp.get(value, 0)
            total += count

            tmp[value] = total

        for pred, count in tmp.items():
            filtered.append({'doc_count': count, 'key': pred})

        return sort_filtered(filtered)

    # this is used to prune the final aggregation 'buckets'

    rsp_filter = None

    # these are appended to aggrs['hierarchies']['terms']

    include_filter = None
    exclude_filter = None

    if kwargs.get('filter', False) == 'namespaces':

        rsp_filter = filter_namespaces

        # all the namespaces for a predicate and value

        if kwargs.get('predicate', None) and kwargs.get('value', None):

            esc_pred = flask.g.search_idx.escape(kwargs['predicate'])
            esc_value = flask.g.search_idx.escape(kwargs['value'])

            include_filter = '.*\.' + esc_pred + '\.' + esc_value + '$'

        # all the namespaces for a predicate

        elif kwargs.get('predicate', None):

            esc_pred = flask.g.search_idx.escape(kwargs['predicate'])

            include_filter = '^.*\.' + esc_pred
            exclude_filter = '.*\/.*\/.*'

        # all the namespaces for a value 
            
        elif kwargs.get('value', None):

            esc_value = flask.g.search_idx.escape(kwargs['value'])

            include_filter = '.*\..*\.' + esc_value + '$'

        # all the namespaces
        
        else:

            exclude_filter = '.*\..*'

    elif kwargs.get('filter', None) == 'predicates':

        rsp_filter = filter_predicates

        # all the predicates for a namespace and value

        if kwargs.get('namespace', None) and kwargs.get('value', None):

            esc_ns = flask.g.search_idx.escape(kwargs['namespace'])
            esc_value = flask.g.search_idx.escape(kwargs['value'])

            include_filter = '^' + esc_ns + '\..*\.' + esc_value + '$'

        # all the predicates for a namespace

        elif kwargs.get('namespace', None):

            esc_ns = flask.g.search_idx.escape(kwargs['namespace'])

            include_filter = '^' + esc_ns + '\.[^\.]+'
            exclude_filter = '.*\..*\..*'

        # all the predicates for a value

        elif kwargs.get('value', None):

            esc_value = flask.g.search_idx.escape(kwargs['value'])

            include_filter = '.*\..*\.' + esc_value + '$'
            
        # all the predicates

        else:

            include_filter = '.*\..*'
            exclude_filter = '.*\..*\..*'
        
    elif kwargs.get('filter', None) == 'values':

        rsp_filter = filter_values

        # all the values for namespace and predicate

        if kwargs.get('namespace', None) and kwargs.get('predicate', None):

            esc_ns = flask.g.search_idx.escape(kwargs['namespace'])
            esc_pred = flask.g.search_idx.escape(kwargs['predicate'])

            include_filter = '^' + esc_ns + '\.' + esc_pred + '\..*'

        # all the values for a namespace

        elif kwargs.get('namespace', None):

            esc_ns = flask.g.search_idx.escape(kwargs['namespace'])

            include_filter = '^' + esc_ns + '\..*\..*'

        # all the values for a predicate
    
        elif kwargs.get('predicate', None):
            
            esc_pred = flask.g.search_idx.escape(kwargs['predicate'])

            include_filter = '^.*\.' + esc_pred + '\..*'

        # all the values

        else:

            include_filter = '.*\..*\..*'

    else:
        pass

    if include_filter:
        aggrs['hierarchies']['terms']['include'] = include_filter

    if exclude_filter:
        aggrs['hierarchies']['terms']['exclude'] = exclude_filter

    body = {
        'aggregations': aggrs,
    }

    query = { 
        'search_type': 'count'
    }

    # import pprint
    # print pprint.pformat(body)

    args = { 'body': body, 'query': query }
    rsp = flask.g.search_idx.search_raw(**args)

    aggregations = rsp.get('aggregations', {})
    results = aggregations.get('hierarchies', {})
    buckets = results.get('buckets', [])

    total_count = 0

    for b in buckets:
        total_count += b['doc_count']

    if rsp_filter:
        buckets = rsp_filter(buckets)

    return buckets

@app.route("/tags", methods=["GET"])
@app.route("/tags/", methods=["GET"])
def tags():

    # please to make me work with wof:tags - which isn't
    # a problem yet since SG venues are the only things
    # with (not null) wof:tags and those are just being
    # copied from sg:tags but you know eventually other
    # things will have tags too...
    # (21050910/thisisaaronland)

    aggrs = {
        'placetypes': {
            'terms': {
                'field': 'sg:tags',
                'size': 0,
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

    # please paginate me (20150910/thisisaaronland)

    aggregations = rsp.get('aggregations', {})
    results = aggregations.get('placetypes', {})
    buckets = results.get('buckets', [])

    return flask.render_template('tags.html', tags=buckets)

@app.route("/names", methods=["GET"])
@app.route("/names/", methods=["GET"])
def names():

    aggrs = {
        'placetypes': {
            'terms': {
                'field': 'wof:name',
                'size': 100,
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

    # please paginate me (20150910/thisisaaronland)

    aggregations = rsp.get('aggregations', {})
    results = aggregations.get('placetypes', {})
    buckets = results.get('buckets', [])

    return flask.render_template('names.html', names=buckets)

@app.route("/tags/<tag>", methods=["GET"])
@app.route("/tags/<tag>/", methods=["GET"])
def tag(tag):

    tag = sanitize_str(tag)
    esc_tag = flask.g.search_idx.escape(tag)

    query = {
        'multi_match': {
            'query': esc_tag,
            'type': 'best_fields',
            'fields': [ 'sg:tags', 'wof:tags' ],
            'operator': 'OR',
        }
    }

    query = enfilterify(query)

    body = {
        'query': query,
    }

    args = {'per_page': 50}

    page = get_int('page')
    page = get_single(page)

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
        'tag': tag,
        'es_query': body,
        'facets': facets,
        'facet_url': facet_url,
    }

    return flask.render_template('tag.html', **template_args)

@app.route("/categories/<category>", methods=["GET"])
@app.route("/categories/<category>/", methods=["GET"])
def category(category):

    category = sanitize_str(category)
    esc_category = flask.g.search_idx.escape(category)

    query = {
        'multi_match': {
            'query': esc_category,
            'type': 'best_fields',
            'fields': [ 'sg:classifiers.category', 'sg:classifiers.type', 'sg:classifiers.subcategory' ],
            'operator': 'OR',
        }
    }

    query = enfilterify(query)

    body = {
        'query': query,
    }

    args = {'per_page': 50}

    page = get_int('page')
    page = get_single(page)

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
        'category': category,
        'es_query': body,
        'facets': facets,
        'facet_url': facet_url,
    }

    return flask.render_template('category.html', **template_args)

@app.route("/postalcode/<code>", methods=["GET"])
@app.route("/postalcode/<code>/", methods=["GET"])
@app.route("/postalcodes/<code>", methods=["GET"])
@app.route("/postalcodes/<code>/", methods=["GET"])
def code(code):

    code = sanitize_str(code)
    esc_code = flask.g.search_idx.escape(code)

    query = {
        'multi_match': {
            'query': esc_code,
            'type': 'best_fields',
            'fields': [ 'sg:postcode' ],
            'operator': 'OR',
        }
    }

    query = enfilterify(query)

    body = {
        'query': query,
    }

    args = {'per_page': 50}

    page = get_int('page')
    page = get_single(page)

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
        'postcode': code,
        'es_query': body,
        'facets': facets,
        'facet_url': facet_url,
    }

    return flask.render_template('postcode.html', **template_args)

"""
@app.route("/reverse", methods=["GET"])
@app.route("/reverse/", methods=["GET"])
def reverse_geocode():

    lat = get_float('latitude')
    lat = get_single(lat)

    lon = get_float('longitude')
    lon = get_single(lon)

    ll = get_str('ll')
    ll = get_single(ll)

    if not lat and not lon and ll:

        ll = ll.split(',')

        if len(ll) == 2:

            lat = ll[0].strip()
            lon = ll[1].strip()

            lat = sanitize_float(lat)
            lon = sanitize_float(lon)
        
    if not lat and not lon:
        logging.warning("missing latitude and longitude")
        flask.abort(400)

    if not utils.is_valid_latitude(lat) or not utils.is_valid_longitude(lon):
        logging.warning("invalid latitude or longitude")
        flask.abort(400)

    placetypes = get_str("placetypes")
    placetypes = get_single(placetypes)

    if not placetypes:
        logging.warning("missing placetypes")
        flask.abort(400)

    placetypes = placetypes.split(',')

    for p in placetypes:
        if not pt.is_valid_placetype(p):
            logging.warning("invalid placetype")
            flask.abort(400)

    features = flask.g.spatial_db.get_by_latlon_recursive(lat, lon, placetypes=placetypes) 
    features = list(features)

    collection = { 'type': 'FeatureCollection', 'features': [ features ] }
    return flask.jsonify(collection)
"""

@app.route("/search", methods=["GET"])
@app.route("/search/", methods=["GET"])
def searchify():

    q = get_str('q')
    q = get_single(q)

    if not q or q == '':
        return flask.render_template('search_form.html')
    
    esc_q = flask.g.search_idx.escape(q)

    # https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-match-query.html

    query = {
        # 'query_string': { 'query': esc_q }
        'match': { '_all': { 'query': esc_q, 'operator': 'and' } }
    }

    query = enfilterify(query)

    import pprint
    print pprint.pformat(query)

    sort = [
        # https://github.com/whosonfirst/whosonfirst-www-spelunker/pull/9
        # { '_score': { 'order': 'desc' } },
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

    args = {'per_page': 50}

    page = get_int('page')
    page = get_single(page)

    if page:
        args['page'] = page

    rsp = flask.g.search_idx.search(body, **args)

    # see also: https://github.com/whosonfirst/whosonfirst-www-spelunker/issues/6

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
        'es_query': body,
        'facets': facets,
        'facet_url': facet_url,
    }

    return flask.render_template('search_results.html', **template_args)

def facetify(query):

    aggrs = {
        'placetype': {
            'terms': {
                'field': 'wof:placetype',
                'size': 0
            }
        },
        'iso': {
            'terms': {
                'field': 'iso:country',
                'size': 0
            }
        },
        'tag': {
            'terms': {
                'field': 'sg:tags',
                'size': 0
            }
        },
        'category': {
            'terms': {
                'field': 'category',	# as in sg:classfiers.category
                'size': 0
            }
        },
        'locality_id': {
            'terms': {
                'field': 'locality_id',
                'size': 100
            }
        },
        'region_id': {
            'terms': {
                'field': 'region_id',
                'size': 100
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

# because you know this is all going to break in 2.x...
# https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-filtered-query.html
# https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html

def enfilterify(query):

    filters = []

    placetype = get_str('placetype')
    iso = get_str('iso')

    tag = get_str('tag')
    category = get_str('category')

    locality = get_int('locality_id')
    region = get_int('region_id')

    # sudo make me a switch

    filters.append({ 'bool': {
        'must_not': { 
            # Y U NO WORK ON PROD??? (20160531/thisisaaronland)
            # 'regexp': { 'edtf:deprecated' : '.*' }

            # see above - one day this will bite us in the ass...
            # (20160531/thisisaaronland)
            'exists': { 'field' : 'edtf:deprecated' }
        }
    }})

    if placetype:

        ids = []
        pts = []

        for p in placetype:

            if not pt.is_valid_placetype(p):
                logging.warning("invalid placetype %s" % p)
                flask.abort(404)

            pts.append(p)

            # placetype = pt.placetype(p)
            # ids.append(placetype.id())
            
        if len(ids) == 1:

            filters.append({ 'term': {
                # 'wof:placetype_id' : ids[0]
                'wof:placetype': pts[0]
            }})

        else:

            filters.append({ 'terms': {
                # 'wof:placetype_id' : ids
                'wof:placetype': pts
            }})


    if iso:

        if len(iso) == 1:

            iso = get_single(iso)
            iso = iso.lower()
            esc_iso = flask.g.search_idx.escape(iso)
            
            filters.append({ 'term': {
                'iso:country' : esc_iso
            }})

        else:

            esc_iso = []

            for i in iso:
                i = i.lower()
                esc_iso.append(flask.g.search_idx.escape(i))

            filters.append({ 'terms': {
                'iso:country' : esc_iso
            }})
                
    if tag:

        if len(tag) == 1:

            tag = get_single(tag)
            esc_tag = flask.g.search_idx.escape(tag)

            # https://stackoverflow.com/questions/16776260/elasticsearch-multi-match-with-filter

            filters.append({ 'query': { 'multi_match': {
                'query': esc_tag,
                'type': 'best_fields',
                'fields': [ 'sg:tags', 'wof:tags' ],
                'operator': 'OR',
            }}})

        else:

            esc_tags = map(flask.g.search_idx.escape, tag)

            filters.append({ 'terms': {
                'sg:tags' : esc_tags
            }})

    if category:

        if len(category) == 1:
            category = get_single(category)
            esc_cat = flask.g.search_idx.escape(category)
            
            filters.append({ 'term': {
                'category' : esc_cat
            }})
        else:
            esc_cat = map(flask.g.search_idx.escape, category)

            filters.append({ 'terms': {
                'category' : esc_cat
            }})

    mt = get_str('mt')

    if mt:

        """
        mt = mapzen.whosonfirst.machinetag.machinetag(mt)

        if mt.is_machinetag():
            pass
        elif mt.is_wildcard_machinetag():
            pass
        else:
            pass
        """

        ns = 'services'
        pred = 'personal'
        pred = 'food_and_drink'
        value = 'beauty_salon'

        ns = None
        # pred = None
        value = None

        esc_ns = None
        esc_pred = None
        esc_value = None

        if ns:
            esc_ns = flask.g.search_idx.escape(ns)
        
        if pred:
            esc_pred = flask.g.search_idx.escape(pred)

        if value:
            esc_value = flask.g.search_idx.escape(value)

        machinetag_field = 'xx:categories'
        machinetag_filter = None

        # https://www.elastic.co/guide/en/elasticsearch/reference/1.7/query-dsl-regexp-query.html#regexp-syntax

        if ns != None and pred != None and value != None:

            # is machine tag
            machinetag_filter = esc_ns + '\.' + esc_pred + '\.' + esc_value

        elif ns != None and pred == None and value == None:

            # sg:*=
            machinetag_filter = esc_ns + '\..*\\.*'

        elif ns != None and pred != None and value == None:

            # sg:services=
            machinetag_filter = esc_ns + '\.' + esc_pred + '\..*'

        elif ns != None and pred == None and value != None:

            # sg:*=personal
            machinetag_filter = esc_ns + '\.[^\.]+\.' + esc_value

        elif ns == None and pred != None and value != None:

            # *:services=personal
            machinetag_filter = '[^\.]+\.' + esc_pred + '\.' + esc_value

        elif ns == None and pred != None and value == None:

            # *:services=
            machinetag_filter = '[^\.]+\.' + esc_pred + '\..*'

        elif ns == None and pred == None and value != None:
            # *:*=personal

            machinetag_filter = '[^\.]+\.[^\.]+\.' + esc_value

        else:
            # WTF?
            pass

        if machinetag_filter:

            filters.append({'regexp':{
                machinetag_field : machinetag_filter
            }})
        
    #

    if locality:

        if len(locality) == 1:

            locality = get_single(locality)
            esc_loc = locality

            filters.append({ 'term': {
                'locality_id' : esc_loc
            }})
        else:

            esc_locs = locality

            filters.append({ 'terms': {
                'locality_id' : esc_locs
            }})

    if region:

        if len(region) == 1:

            region = get_single(region)
            esc_loc = region

            filters.append({ 'term': {
                'region_id' : esc_loc
            }})

        else:

            esc_locs = region

            filters.append({ 'terms': {
                'region_id' : esc_locs
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

    # hack because middleware stuff...
    url = flask.request.url
    url = url.split("?")
    url = url[0]

    return "%s?%s" % (url, qs)

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


    # WTF... why do I need to do this? it would appear that updates are not being
    # applied but rather being indexed as new records even though they have the
    # same ID because... ??? (20160329/thisisaaronland)
    #
    # see also: https://github.com/whosonfirst/py-mapzen-whosonfirst-search/issues/12

    try:
        return docs[-1]
    except Exception, e:
        print "failed to retrieve %s" % id
        return None

def has_concordance(src, label):

    src = sanitize_str(src)
    concordance = "wof:concordances.%s" % src

    filter = {
            'exists': { 'field': concordance  }
    }

    query = {
        'match_all': {}
    }

    query = {
        'filtered': {
            'filter': filter,
            'query': query
        }
    }

    query = enfilterify(query)
    
    body = {
         'query': query
    }

    args = {'per_page': 50}

    page = get_int('page')
    page = get_single(page)

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
        'src': label,
        'es_query': body,
        'facets': facets,
        'facet_url': facet_url,
    }

    return flask.render_template('concordance.html', **template_args)

def get_by_concordance(id, src):

    concordance = "wof:concordances.%s" % src

    query = {
        'match': { concordance : id }
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

def has_language(lang, spoken=False):

    lang = sanitize_str(lang)

    pylang = None

    # https://pypi.python.org/pypi/pycountry/

    try:
        if len(lang) == 2:
            pylang = pycountry.languages.get(iso639_1_code=lang)
        elif len(lang) == 3:
            pylang = pycountry.languages.get(iso639_3_code=lang)
        elif re.match("^[a-zA-Z ]+$", lang):
            str_lang = lang.title()
            pylang = pycountry.languages.get(name=str_lang)

            if pylang:
                lang = pylang.iso639_3_code

        else:
            pass

    except Exception, e:
        logging.error("weird and freakish language tag %s failed because %s" % (lang, e))

    if pylang:
        lang_common = pylang.name
    else:
        logging.warning("unrecognized language %s" % lang)
        lang_common = lang

    field = "wof:lang_x_official"

    if spoken:
        field = "wof:lang_x_spoken"

    # field = "wof:lang"

    esc_lang = flask.g.search_idx.escape(lang)

    filter = {
            'term': { field: esc_lang  }
    }

    query = {
        'match_all': {}
    }

    query = {
            'filtered': {
                'filter': filter,
                'query': query
            }
    }

    body = {
         'query': query
    }

    # import pprint
    # print pprint.pformat(body)

    args = {'per_page': 50}

    page = get_int('page')
    page = get_single(page)

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
        'lang': lang,
        'lang_common': lang_common,
        'es_query': body,
        'facets': facets,
        'facet_url': facet_url,
    }

    template = "has_language_official.html"

    if spoken:
        template = "has_language_spoken.html"

    return flask.render_template(template, **template_args)

def inflate_hierarchy(doc):

    props = doc.get('properties', {})

    placetype = pt.placetype(props['wof:placetype'])
    ancestors = placetype.ancestors(roles=['common', 'common_optional', 'optional'])

    hierarchies = props.get('wof:hierarchy', [])
    hiers = []

    for hier in hierarchies:

        inflated = []

        for a in ancestors:

            rel = "%s_id" % a
            id = hier.get(rel, None)

            if id:
                inflated.append((a, get_by_id(id)))

        inflated.reverse()
        hiers.append(inflated)

    return hiers

# please put me in a library somewhere...
# please to be porting this at the same time...
# https://github.com/exflickr/flamework/blob/master/www/include/lib_sanitize.php
# (20150831/thisisaaronland)

def get_param(k, sanitize=None):

    param = flask.request.args.getlist(k)
    
    if len(param) == 0:
        return None
        
    if sanitize:
        param = map(sanitize, param)

    return param

def get_single(v):

    if v and type(v) == types.ListType:
        v = v[0]

    return v

def get_str(k):

    param = get_param(k, sanitize_str)
    return param

def get_int(k):

    param = get_param(k, sanitize_int)
    return param

def get_float(k):

    param = get_param(k, sanitize_float)
    return param

def sanitize_str(str):

    if str:
        str = codecs.encode(str, 'utf-8')
        str = str.strip()

    return str
    
def sanitize_int(i):

    if i:
        i = int(i)

    return i

def sanitize_float(f):

    if f:
        f = float(f)

    return f

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

    """
    dsn = spatial.cfg2dsn(cfg, 'spatial')
    os.environ['WOF_SPATIAL_DSN'] = dsn
    """

    os.environ['WOF_SEARCH_HOST'] = cfg.get('search', 'host')
    os.environ['WOF_SEARCH_PORT'] = cfg.get('search', 'port')

    port = int(options.port)

    app.config["APPLICATION_ROOT"] = "/spelunker"

    # Seriously do not ever run this with 'debug=True' no matter
    # how tempting. It is a bad idea. It will make you sad.

    app.run(port=port)

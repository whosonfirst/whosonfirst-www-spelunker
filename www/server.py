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
from werkzeug.datastructures import Headers
from flask.ext.cors import cross_origin
# from flask_cors import cross_origin

import re
import time
import random
import types
import math
import json
import pycountry
import pprint

# https://github.com/whosonfirst/py-machinetag
# https://github.com/whosonfirst/py-machinetag-elasticsearch

import machinetag
import machinetag.elasticsearch.wildcard
import machinetag.elasticsearch.hierarchy

import mapzen.whosonfirst.utils as utils
import mapzen.whosonfirst.search as search
import mapzen.whosonfirst.placetypes as pt
import mapzen.whosonfirst.sources as src
import mapzen.whosonfirst.uri as uri

# helpful for figuring out headers aren't being set...
# logging.getLogger('flask_cors').level = logging.DEBUG

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
    search_index = os.environ.get('WOF_SEARCH_INDEX', 'whosonfirst')
    
    # https://github.com/whosonfirst/whosonfirst-www-spelunker/issues/37

    search_idx = search.query(host=search_host, port=search_port, index=search_index)
    flask.g.search_idx = search_idx

@app.template_filter()
def urlencode(value):
    s = unicode(value)
    return urllib.quote(s)

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

@app.errorhandler(404)
def page_not_found(e):
    return flask.render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    return flask.render_template('500.html'), 404

@app.route("/500", methods=["GET"])
@app.route("/500/", methods=["GET"])
def server_error():
    flask.abort(500)

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

# https://www.w3.org/TR/cors/#resource-requests
# https://github.com/CoryDolphin/flask-cors#route-specific-cors-via-decorator

@app.route("/id/<int:id>.geojson", methods=["GET"])
@cross_origin()
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

    append_source_details_to_buckets(buckets)
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

@app.route("/nullisland", methods=["GET"])
@app.route("/nullisland/", methods=["GET"])
def nullisland():

    query = {
        'multi_match': {
            'query': 0.0,
            'fields': [ 'geom:latitude', 'geom:longitude']
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
        'es_query': body,
        'facets': facets,
        'facet_url': facet_url,
    }

    return flask.render_template('nullisland.html', **template_args)

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

    if not pt.is_valid_placetype(placetype) and placetype != 'airport':
        flask.abort(404)

    query = {
        'term': {
            'wof:placetype': placetype
        }
    }

    if placetype == 'airport':

        query = {'filtered': {
            'filter': { 'term': { 'wof:category': 'airport' } },
            'query': { 'term': { 'wof:placetype': 'campus' } }
        }}

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

#

@app.route("/machinetags", methods=["GET"])
@app.route("/machinetags/", methods=["GET"])
def mt_hierarchies():
    es_query, buckets = machinetag_hierarchies('machinetags_all')
    return flask.render_template('machinetag_hierarchies.html', mt=buckets, whoami='all the things', es_query=es_query)

@app.route("/machinetags/namespaces", methods=["GET"])
@app.route("/machinetags/namespaces/", methods=["GET"])
def mt_hierarchies_namespaces():
    es_query, buckets = machinetag_hierarchies('machinetags_all', filter='namespaces')
    return flask.render_template('machinetag_hierarchies_namespaces.html', mt=buckets, es_query=es_query)

@app.route("/machinetags/namespaces/<string:ns>", methods=["GET"])
@app.route("/machinetags/namespaces/<string:ns>/", methods=["GET"])
def mt_hierarchies_for_namespace(ns):
    es_query, buckets = machinetag_hierarchies('machinetags_all', namespace=ns)
    return flask.render_template('machinetag_hierarchies.html', mt=buckets, whatami='namespace', whoami=ns, es_query=es_query)

@app.route("/machinetags/namespaces/<string:ns>/predicates", methods=["GET"])
@app.route("/machinetags/namespaces/<string:ns>/predicates/", methods=["GET"])
def mt_hierarchies_predicates_for_namespace(ns):
    es_query, buckets = machinetag_hierarchies('machinetags_all', filter='predicates', namespace=ns)
    return flask.render_template('machinetag_hierarchies_predicates.html', mt=buckets, whatami='namespace', whoami=ns, es_query=es_query)

@app.route("/machinetags/namespaces/<string:ns>/values", methods=["GET"])
@app.route("/machinetags/namespaces/<string:ns>/values/", methods=["GET"])
def mt_hierarchies_values_for_namespace(ns):
    es_query, buckets = machinetag_hierarchies('machinetags_all', filter='values', namespace=ns)
    return flask.render_template('machinetag_hierarchies_values.html', mt=buckets, whatami='namespace', whoami=ns, es_query=es_query)

# PLEASE MAYBE WRITE ME /machinetags/namespaces/<string:ns>/predicates/<string:pred>/values

@app.route("/machinetags/predicates", methods=["GET"])
@app.route("/machinetags/predicates/", methods=["GET"])
def mt_hierarchies_predicates():
    es_query, buckets = machinetag_hierarchies('machinetags_all', filter='predicates')
    return flask.render_template('machinetag_hierarchies_predicates.html', mt=buckets, es_query=es_query)

@app.route("/machinetags/predicates/<string:pred>", methods=["GET"])
@app.route("/machinetags/predicates/<string:pred>/", methods=["GET"])
def mt_hierarchies_for_predicate(pred):
    es_query, buckets = machinetag_hierarchies('machinetags_all', predicate=pred)
    return flask.render_template('machinetag_hierarchies.html', mt=buckets, whatami='predicate', whoami=pred, es_query=es_query)

@app.route("/machinetags/predicates/<string:pred>/namespaces", methods=["GET"])
@app.route("/machinetags/predicates/<string:pred>/namespaces/", methods=["GET"])
def mt_hierarchies_namespaces_for_predicate(pred):
    es_query, buckets = machinetag_hierarchies('machinetags_all', filter='namespaces', predicate=pred)
    return flask.render_template('machinetag_hierarchies_namespaces.html', mt=buckets, whatami='predicate', whoami=pred, es_query=es_query)

@app.route("/machinetags/predicates/<string:pred>/values", methods=["GET"])
@app.route("/machinetags/predicates/<string:pred>/values/", methods=["GET"])
def mt_hierarchies_values_for_predicate(pred):
    es_query, buckets = machinetag_hierarchies('machinetags_all', filter='values', predicate=pred)
    return flask.render_template('machinetag_hierarchies_values.html', mt=buckets, whatami='predicate', whoami=pred, es_query=es_query)

# PLEASE MAYBE WRITE ME /machinetags/predicates/<string:pred>/values/<string:value>/namespaces

@app.route("/machinetags/values", methods=["GET"])
@app.route("/machinetags/values/", methods=["GET"])
def mt_hierarchies_values():
    es_query, buckets = machinetag_hierarchies('machinetags_all', filter='values')
    return flask.render_template('machinetag_hierarchies_values.html', mt=buckets, es_query=es_query)

@app.route("/machinetags/values/<string:value>", methods=["GET"])
@app.route("/machinetags/values/<string:value>/", methods=["GET"])
def mt_hierarchies_for_value(value):
    es_query, buckets = machinetag_hierarchies('machinetags_all', value=value)
    return flask.render_template('machinetag_hierarchies.html', mt=buckets, whatami='value', whoami=value, es_query=es_query)

@app.route("/machinetags/values/<string:value>/namespaces", methods=["GET"])
@app.route("/machinetags/values/<string:value>/namespaces/", methods=["GET"])
def mt_hierarchies_namespaces_for_value(value):
    es_query, buckets = machinetag_hierarchies('machinetags_all', filter='namespaces', value=value)
    return flask.render_template('machinetag_hierarchies_namespaces.html', mt=buckets, whatami='value', whoami=value, es_query=es_query)

@app.route("/machinetags/values/<string:value>/predicates", methods=["GET"])
@app.route("/machinetags/values/<string:value>/predicates/", methods=["GET"])
def mt_hierarchies_predicates_for_value(value):
    es_query, buckets = machinetag_hierarchies('machinetags_all', filter='predicates', value=value)
    return flask.render_template('machinetag_hierarchies_predicates.html', mt=buckets, whatami='value', whoami=value, es_query=es_query)

# PLEASE MAYBE WRITE ME /machinetags/values/<string:value>/predicates/<string:pred>/namespaces

@app.route("/machinetags/places/<string:ns_or_mt>", methods=["GET"])
@app.route("/machinetags/places/<string:ns_or_mt>/", methods=["GET"])
def mt_places_for_namespace(ns_or_mt):

    mt = machinetag.from_string(ns_or_mt, allow_wildcards=True)

    if not mt.is_machinetag():
        mt  = machinetag.from_triple(ns_or_mt, "*", None, allow_wildcards=True)

    if not mt.is_machinetag():
        flask.abort(404)

    return machinetag_places('machinetags_all', mt)

@app.route("/machinetags/places/<string:ns>/<string:pred>", methods=["GET"])
@app.route("/machinetags/places/<string:ns>/<string:pred>/", methods=["GET"])
def mt_places_for_namespace_and_predicate(ns, pred):

    mt  = machinetag.from_triple(ns, pred, None, allow_wildcards=True)

    if not mt.is_machinetag():
        flask.abort(404)

    return machinetag_places('machinetags_all', mt)

@app.route("/machinetags/places/<string:ns>/<string:pred>/<string:value>", methods=["GET"])
@app.route("/machinetags/places/<string:ns>/<string:pred>/<string:value>/", methods=["GET"])
def mt_places_for_namespace_and_predicate_and_value(ns, pred, value):

    mt  = machinetag.from_triple(ns, pred, value, allow_wildcards=True)

    if not mt.is_machinetag():
        flask.abort(404)

    return machinetag_places('machinetags_all', mt)

def machinetag_places(field, mt):

    machinetag_filter = machinetag.elasticsearch.wildcard.query_filter_from_machinetag(mt)

    query = {
        'match_all': {}
    }

    filter = {'regexp': {
        field : machinetag_filter
    }}

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
        'src': mt.as_string(),
        'es_query': body,
        'facets': facets,
        'facet_url': facet_url,
    }

    return flask.render_template('machinetag_places.html', **template_args)

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

    include_filter, exclude_filter, rsp_filter = machinetag.elasticsearch.hierarchy.query_filters(**kwargs)

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

    args = { 'body': body, 'query': query }
    rsp = flask.g.search_idx.search_raw(**args)

    aggregations = rsp.get('aggregations', {})
    results = aggregations.get('hierarchies', {})
    buckets = results.get('buckets', [])

    total_count = 0

    if rsp_filter:
        buckets = rsp_filter(buckets)

    for b in buckets:
        total_count += b['doc_count']

        ns = b.get('namespace', None)
        pred = b.get('predicate', None)
        value = b.get('value', None)

        mt = None

        if ns == None and pred == None and value == None:

            mt = machinetag.elasticsearch.hierarchy.unpathify_as_machinetag(b['key'])

        else:

            if ns == None:
                ns = '*'
            elif pred == None:
                pred = '*'
            else:
                pass

            mt = machinetag.from_triple(ns, pred, value)

        if mt.is_machinetag():

            ns = mt.namespace()
            pred = mt.predicate()
            value = mt.value()

            b['namespace'] = ns
            b['predicate'] = pred
            b['value'] = value
            b['machinetag'] = mt.as_string()

    # print buckets
    return (aggrs, buckets)

@app.route("/tags", methods=["GET"])
@app.route("/tags/", methods=["GET"])
def tags():

    aggrs = {
        'placetypes': {
            'terms': {
                'field': 'tags_all',
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
        'match': { 'tags_all': esc_tag }
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

# https://developer.mozilla.org/en-US/Add-ons/Creating_OpenSearch_plugins_for_Firefox
# http://www.opensearch.org/Specifications/OpenSearch/Extensions/Parameter/1.0

@app.route("/opensearch", methods=["GET"])
@app.route("/opensearch/", methods=["GET"])
def opensearch():

    # valid = [ 'alt', 'name', 'names', 'preferred' ]

    headers = Headers()
    headers.add("Content-type", "application/opensearchdescription+xml")

    body = flask.render_template('opensearch.xml')
    return flask.Response(body, headers=headers)

@app.route("/opensearch/<scope>", methods=["GET"])
@app.route("/opensearch/<scope>/", methods=["GET"])
def opensearch_scoped(scope):

    valid = {
        'alt': 'alternate names',
        'name': 'default names',
        'names': 'names',
        'preferred': 'preferred names',
    }

    if not valid.get(scope, None):
        flask.abort(404)

    headers = Headers()
    headers.add("Content-type", "application/opensearchdescription+xml")

    body = flask.render_template('opensearch.xml', scope=scope, label=valid[scope])
    return flask.Response(body, headers=headers)

@app.route("/search", methods=["GET"])
@app.route("/search/", methods=["GET"])
def searchify():

    q = get_str('q')
    q = get_single(q)

    if q and re.match(r'^\d+$', q):

        id = int(q)

        location = flask.url_for('info', id=id, _external=True)
        return flask.redirect(location, code=303)        

    try:
        query, rsp = do_search()
    except Exception, e:
        logging.error("query failed because %s" % e)
        return flask.render_template('search_form.html', error=True)

    # see also: https://github.com/whosonfirst/whosonfirst-www-spelunker/issues/6

    query_string = None

    q = get_str('q')
    q = get_single(q)

    name = get_str('name')
    name = get_single(name)

    names = get_str('names')
    names = get_single(names)

    preferred = get_str('preferred')
    preferred = get_single(preferred)

    alt = get_str('alt')
    alt = get_single(alt)

    for possible in (q, name, names, preferred, alt):

        if possible != None and possible != "":
            query_string = possible
            break

    pagination = rsp['pagination']
    docs = rsp['rows']

    facets = facetify(query['query'])

    pagination_url = build_pagination_url()
    facet_url = pagination_url

    template_args = {
        'docs': docs,
        'pagination': pagination,
        'pagination_url': pagination_url,
        'query': q,
        'query_string': query_string,
        'es_query': query,
        'facets': facets,
        'facet_url': facet_url,
    }

    return flask.render_template('search_results.html', **template_args)

@app.route("/api/search", methods=["GET"])
@app.route("/api/search/", methods=["GET"])
def api_searchify():

    try:
        query, rsp = do_search()
    except Exception, e:
        return flask.render_template('search_form.html')

    feature_col = {
        'type': 'FeatureCollection',
        'features': rsp['rows'],
        'pagination': rsp['pagination'],
    }

    return flask.jsonify(feature_col)

def do_search():

    q = get_str('q')
    q = get_single(q)

    # see what's going on here? this is a thing we're going to try without
    # telling anyone yet - we ensure that there is at least one filter below
    # (20160701/thisisaaronland)

    if not q or q == '':

        q = 'ALL THE THINGS'
        esc_q = '*'

        query = {
            'match_all': {}
        }

    else:
        esc_q = flask.g.search_idx.escape(q)

        query = {
            'match': { '_all': { 'query': esc_q, 'operator': 'and' } }
        }

    # searching for stuff breaks down in to four distinct parts - which should
    # be interpreted as "wet paint", "I have no idea what I am dooooing" and so on...
    #
    # 1. searching for a string across all fields
    # 2. filtering by one or more properties (passed in as query args)
    # 3. scoring the results by sub-properties
    # 4. sorting

    # 1. searching for a string across all fields
    # https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-match-query.html


    # 2. filtering by one or more properties (passed in as query args)

    query = enfilterify(query)

    # okay, let's stop and make sure we're not just blindly querying the entire
    # index - specifically we should have at least one filter whether it is user
    # supplied or the default 'exclude deprecated records' filter.
    # (20160701/thisisaaronland)

    if esc_q == '*' and len(query['filtered']['filter']['and']) < 2:
        raise Exception, "E_INSUFFICIENT_SEARCH"

    # 3. scoring the results by sub-properties
    # https://www.elastic.co/guide/en/elasticsearch/reference/1.7/query-dsl-function-score-query.html#score-functions

    filters = []

    if esc_q != '*':

        filters.extend([
            {
            'filter': { 'term': { 'names_preferred': esc_q, } }, 'weight': 3.0
            },
            {
                'filter': { 'term': { 'names_all': esc_q, } }, 'weight': 1.0
            },
            {
                'filter': { 'term': { 'wof:name' : esc_q } }, 'weight': 1.5
            }
        ])

    # TO DO: check to see if we have any names_* related parameters...

    filters.extend([
        {
            'filter': { 'not': { 'term': { 'wof:placetype' : 'venue' } } }, 'weight': 2.0
        },
        {
            'filter': { 'exists': { 'field': 'wk:population' } }, 'weight': 1.25
        }
    ])

    query_scored = {
        'function_score': {
            'query': query,
            'functions': filters,
            'score_mode': 'multiply',
            'boost_mode': 'multiply',
        }
    }

    # 4. sorting

    sort = [
        { 'geom:area': {'order': 'desc', 'mode': 'max'} },
        { 'wof:scale' : {'order': 'desc', 'mode': 'max' } },
        { 'wof:megacity' : {'order': 'desc', 'mode': 'max' } },
        { 'gn:population' : {'order': 'desc', 'mode': 'max' } },
    ]

    body = {
        'query': query_scored,
        'sort': sort,
    }

    args = {'per_page': 50}

    page = get_int('page')
    page = get_single(page)

    if page:
        args['page'] = page

    rsp = flask.g.search_idx.search(body, **args)
    return body, rsp

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
                'field': 'tags_all',
                'size': 0,
            }
        },
        'category': {
            'terms': {
                'field': 'sg:classifiers.category',	# as in sg:classfiers.category
                'size': 0
            }
        },
        'locality_id': {
            'terms': {
                'field': 'wof:hierarchy.locality_id',
                'size': 100
            }
        },
        'region_id': {
            'terms': {
                'field': 'wof:hierarchy.region_id',
                'size': 100
            }
        },
        'concordance': {
            'terms': {
                'field': 'wof:concordances_sources',
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

    facets = {}

    for k, ignore in aggrs.items():
        results = aggregations.get(k, {})
        results = results.get('buckets', [])

        if k == 'concordance':
            append_source_details_to_buckets(results)

        facets[k] = results

    return facets

# because you know this is all going to break in 2.x...
# https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-filtered-query.html
# https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html

def enfilterify(query):

    filters = []
    mustnot = []

    placetype = get_str('placetype')
    iso = get_str('iso')

    tag = get_str('tag')
    category = get_str('category')

    mt = get_str('mt')
    mt = get_single(mt)

    name = get_str('name')		# wof:name
    names = get_str('names')		# names_all

    preferred = get_str('preferred')	# names_preferred
    alt = get_str('alt')		# names_colloquial; names_variant

    colloquial = get_str('colloquial')	# names_colloquial
    variant = get_str('variant')	# names_variant

    country = get_int('country_id')
    region = get_int('region_id')
    locality = get_int('locality_id')
    neighbourhood = get_int('neighbourhood_id')

    exclude = get_str('exclude')
    include = get_str('include')

    nullisland = True
    deprecated = False

    if exclude:

        for e in exclude:

            if e == 'nullisland':
                nullisland = False

    if include:

        for i in include:
            
            if i == "deprecated":
                deprecated = True

    if not nullisland:

        mustnot.append({
            'term': { 'geom:latitude': 0.0 }
        })

        mustnot.append({
            'term': { 'geom:longitude': 0.0 }
        })

    if not deprecated:

        mustnot.append({ 
            
            # Y U NO WORK ON PROD??? (20160531/thisisaaronland)
            # 'regexp': { 'edtf:deprecated' : '.*' }
            # see above - one day this will bite us in the ass...
            # (20160531/thisisaaronland)

            'exists': { 'field' : 'edtf:deprecated' }
        })
        
    #

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

        for idx,value in enumerate(iso):
            iso[idx] = value.lower()

        filters.append(simple_enfilter('iso:country', iso))
                
    if tag:

        if len(tag) == 1:

            tag = get_single(tag)
            esc_tag = flask.g.search_idx.escape(tag)

            filters.append({ 'query': { 'match': {
                'tags_all': esc_tag,
            }}})

        else:

            esc_tags = map(flask.g.search_idx.escape, tag)

            if len(esc_tags) == 1:

                filters.append({ 'term': {
                    'tags_all' : esc_tags[0],
                }})

            else:

                must = []
                
                for t in esc_tags:
                    must.append({ 'term': { 'tags_all': t }})
                    
                filters.append({ 'bool': {
                    'must': must
                }})
        
    if category:

        if len(category) == 1:

            filters.append(simple_enfilter('category', category))

        else:
            esc_cat = map(flask.g.search_idx.escape, category)

            must = []
                
            for c in esc_cat:
                must.append({ 'term': { 'category': c }})
                    
            filters.append({ 'bool': {
                'must': must
            }})

    if mt:

        machinetag_filter = machinetag.elasticsearch.wildcard.query_filter_from_string(mt)
        machinetag_field = 'machinetags_all'

        if machinetag_filter:
            
            filters.append({'regexp':{
                machinetag_field : machinetag_filter
            }})
        
    if names:
        filters.append(simple_enfilter('names_all', names))

    if preferred:
        filters.append(simple_enfilter('names_preferred', preferred))

    if alt:
        filters.append(simple_enfilter('names_alt', alt))

    if colloquial:
        filters.append(simple_enfilter('names_colloquial', colloquial))

    if variant:
        filters.append(simple_enfilter('names_variant', variant))

    if name:
        filters.append(simple_enfilter('wof:name', name))

    if country:
        filters.append(simple_enfilter('country_id', country))

    if region:
        filters.append(simple_enfilter('region_id', region))

    if locality:
        filters.append(simple_enfilter('locality_id', locality))

    if neighbourhood:
        filters.append(simple_enfilter('neighbourhood_id', neighbourhood))

    concordance = get_str('concordance')

    if concordance:
        filters.append(simple_enfilter('wof:concordances_sources', concordance))

    # oh elasticsearch... Y U MOON LANGUAGE?
    # https://github.com/elastic/elasticsearch/issues/1688#issuecomment-5415536

    if len(mustnot):
        filters.append({ 'bool': {
            'must_not': mustnot
        }})

    if len(filters):

        query = {
            'filtered': {
                'query': query,
                'filter': { 'and': filters }
            }
        }

    return query

def simple_enfilter(field, terms):

    if len(terms) == 1:

        term = get_single(terms)

        if type(term) == types.IntType:
            esc_term = term
        else:
            esc_term = flask.g.search_idx.escape(term)

        # the old way (20160707/thisisaaronland)
        # return { 'term': { field: esc_term }}

        return { 'query': { 'match': { field: { 'query': esc_term, 'operator': 'and' }}} }

    else:

        esc_terms = []
            
        for t in terms:

            if type(t) == types.IntType:
                esc_terms.append(t)
            else:
                esc_terms.append(flask.g.search_idx.escape(t))

        # the old way (20160707/thisisaaronland)
        # return { 'terms': { field : esc_terms } }

        min = len(terms)

        must = []

        for t in esc_terms:

            # the old way (20160707/thisisaaronland)
            # must.append({ 'term': { field: t }})

            must.append({ 'query': { 'match': { field: { 'query': t, 'operator': 'and' }}}})
            
        return {
            'bool': { 'must': must }
        }

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

    # import pprint
    # print pprint.pformat(docs)

    # WTF... why do I need to do this? it would appear that updates are not being
    # applied but rather being indexed as new records even though they have the
    # same ID because... ??? (20160329/thisisaaronland)
    #
    # see also: https://github.com/whosonfirst/py-mapzen-whosonfirst-search/issues/12

    try:
        return docs[-1]
    except Exception, e:
        logging.warning("failed to retrieve %s" % id)
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
        logging.warning("failed to retrieve %s" % id)
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

def append_source_details_to_buckets(buckets):

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

    os.environ['WOF_SEARCH_INDEX'] = cfg.get('search', 'index')
    os.environ['WOF_SEARCH_HOST'] = cfg.get('search', 'host')
    os.environ['WOF_SEARCH_PORT'] = cfg.get('search', 'port')

    port = int(options.port)

    app.config["APPLICATION_ROOT"] = "/spelunker"

    # Seriously do not ever run this with 'debug=True' no matter
    # how tempting. It is a bad idea. It will make you sad.

    app.run(port=port)

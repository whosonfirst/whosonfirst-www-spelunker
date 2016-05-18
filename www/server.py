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

@app.route("/geonames/", methods=["GET"])
@app.route("/gn/", methods=["GET"])
def for_geonames():
    return has_concordance('gn:id', 'Geonames')

@app.route("/geoplanet/", methods=["GET"])
@app.route("/gp/", methods=["GET"])
def for_geoplanet():
    return has_concordance('gp:id', 'GeoPlanet')

@app.route("/tgn/", methods=["GET"])
def for_tgn():
    return has_concordance('tgn:id', 'the Getty Thesaurus of Geographic Names')

@app.route("/wikidata/", methods=["GET"])
@app.route("/wd/", methods=["GET"])
def for_wikidata():
    return has_concordance('wd:id', 'Wikidata')

@app.route("/woe/", methods=["GET"])
def for_woe():
    return has_concordance('gp:id', 'Where On Earth (now GeoPlanet)')

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

    return flask.render_template('placetypes.html', placetypes=buckets)

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
        # 'region_id': {
        #     'terms': {
        #         'field': 'region_id',
        #         'size': 100
        #     }
        # }
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

            filters.append({ 'term': {
                'sg:tags' : esc_tag
            }})
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

    return flask.render_template('has_concordance.html', **template_args)

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

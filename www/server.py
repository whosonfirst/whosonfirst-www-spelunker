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
        'docs': docs,
        'pagination': pagination,
        'pagination_url': pagination_url,
        'facets': facets,
        'facet_url': facet_url,
        'doc': doc,
        'es_query': query,
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
        'es_query': query,
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
        'es_query': query,
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
        'es_query': query,
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
        'es_query': query,
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
        'es_query': query,
        'facets': facets,
        'facet_url': facet_url,
    }

    return flask.render_template('postcode.html', **template_args)

@app.route("/search", methods=["GET"])
@app.route("/search/", methods=["GET"])
def searchify():

    q = get_str('q')
    q = get_single(q)

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
        'query': q,
        'es_query': query,
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
                'size': 10
            }
        },
        'region_id': {
            'terms': {
                'field': 'region_id',
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
        facets[k] = results

    return facets

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

        for p in placetype:

            if not pt.is_valid_placetype(p):
                logging.warning("invalid placetype %s" % p)
                flask.abort(404)

            placetype = pt.placetype(p)
            ids.append(placetype.id())

        if len(ids) == 1:

            filters.append({ 'term': {
                'wof:placetype_id' : ids[0]
            }})

        else:

            filters.append({ 'terms': {
                'wof:placetype_id' : ids
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

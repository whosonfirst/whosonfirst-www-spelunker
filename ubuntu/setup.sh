#!/bin/sh

PYTHON=`which python`

ROOT=''

${ROOT}/setup-dependencies.sh

${ROOT}/setup-certificate-authority.sh

${ROOT}/setup-certificates.sh

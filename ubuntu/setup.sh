#!/bin/sh

PYTHON=`which python`

ROOT=''

${ROOT}/setup-dependencies-ubuntu.sh

${ROOT}/setup-certificate-authority.sh

${ROOT}/setup-certificates.sh

${ROOT}/setup-dependencies-py-mapzen.sh

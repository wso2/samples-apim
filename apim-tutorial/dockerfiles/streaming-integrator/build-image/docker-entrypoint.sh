#!/bin/bash

set -e

# check if the WSO2 non-root user home exists
test ! -d "${WORKING_DIRECTORY}" && echo "WSO2 Docker non-root user home does not exist" && exit 1

# check if the WSO2 product home exists
test ! -d "${WSO2_SERVER_HOME}" && echo "WSO2 Docker product home does not exist" && exit 1

# start Streaming Integrator
sh "${WSO2_SERVER_HOME}"/bin/server.sh "$@"
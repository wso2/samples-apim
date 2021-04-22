#!/bin/bash

###### testing
# export APIM_HOST=localhost RETRY_SEC=10 RE_RUN=true
######

apim=$APIM_HOST
export apim
retry=$RETRY_SEC
re_run="${RE_RUN:-false}"
echo "Waiting for Keycloak server to become available"



#while ! nc -z $apim 9443; do   
#  echo "Retrying after " $retry "s..."
#  sleep $retry
#done


echo "Start setting up"

sh setup-keycloak.sh

#echo "=================================Data population completed======================================================"
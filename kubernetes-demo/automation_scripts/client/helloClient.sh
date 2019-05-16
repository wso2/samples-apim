#!/bin/bash

ECHO=`which echo`
function echoBold () {
    ${ECHO} -e $'\e[1m'"${1}"$'\e[0m'
}

source token.txt
source client_config.txt

token=$(cat token.txt | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="access_token"{print $2}')
echo "access token:$token"

echoBold "invoking an API...."

for num in {0..1000} 
do
curl -k -X GET "https://$HOST_NAME_GATEWAY/kuberneteshello/1.0.0" -H  "accept: application/json" -H  "Authorization: Bearer $token"
#sleep 2s
done

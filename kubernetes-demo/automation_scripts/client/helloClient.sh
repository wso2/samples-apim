#!/bin/bash

ECHO=`which echo`
function echoBold () {
    ${ECHO} -e $'\e[1m'"${1}"$'\e[0m'
}
function StatusCheck(){

if [ $status_code != "200" ] 
	then
	echoBold "statuscode:$status_code"
	cat status.txt
	echoBold "error"
	exit 1

elif [ -z "$status_code" ]
	then
	echoBold "statuscode is empty"
	exit 1
echo "statuscode:$status_code"
cat response2.txt	
 fi
}
source token.txt
source client_config.txt

token=$(cat token.txt | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="access_token"{print $2}')
echo "access token:$token"

echoBold "invoking an API...."
for num in {0..10000}
do
status_code="$(curl -s -o status.txt -w "%{http_code}" -k -X GET "https://$HOST_NAME_GATEWAY/hello/1.0.0/" -H  "accept: application/json" -H  "Authorization: Bearer $token")"
StatusCheck
cat status.txt
done

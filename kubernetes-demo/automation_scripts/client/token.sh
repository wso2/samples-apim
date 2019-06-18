#!/bin/bash

# ------------------------------------------------------------------------
# Copyright 2019 WSO2, Inc. (http://wso2.com)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License
# ------------------------------------------------------------------------

#this script automates Generating access token

ECHO=`which echo`
function echoBold () {
    ${ECHO} -e $'\e[1m'"${1}"$'\e[0m'
}

function StatusCheck(){

if [ $status_code == "201" ]
	then
	echo "statuscode:$status_code"
	cat response.txt
elif [ $status_code != "200" ] 
	then
	echoBold "statuscode:$status_code"
	cat response.txt
	echoBold "error"
	exit 1

elif [ -z "$status_code" ]
	then
	echoBold "statuscode is empty"
	exit 1
echo "statuscode:$status_code"
cat response.txt	
 fi
}

source client_config.txt

echoBold ' Obtaining the consumer key/secret key pair...... '
status_code="$(curl -s -o response.txt -w "%{http_code}" -k -X POST -H "Authorization: Basic YWRtaW46YWRtaW4=" -H "Content-Type: application/json" -d @payload.json https://$HOST_NAME_APIM/client-registration/v0.14/register)"
StatusCheck
#echoBold $consumes_secret_key_json
sleep 2s

#getting the client Id
clientId=$(cat response.txt | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="clientId"{print $2}')
echoBold "clientId:$clientId"
#getting the client secrect 
clientSecret=$(cat response.txt  | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="clientSecret"{print $2}')
echoBold "clientSecret:$clientSecret"

if [ -z "$clientId" ] && [ -z "$clientSecret" ]
        then
	echo "Empty clientId & clientSecret"
	exit 1
	fi

echoBold ' encoding clientId and ClientSecrect..... '
#Base64 encoded in the format consumer-key:consumer-secret
encode_key="$clientId:$clientSecret"
echo "encode key:$encode_key"
encoded_key=$(echo -n $encode_key | base64)
echoBold "encoded key:$encoded_key"
if [ -z "$encoded_key" ]
        then
	echoBlod "Empty encoded key"
	exit 1
	fi

echoBold ' Generating the access token..... '
status_code=$(curl -s -o response.txt -w "%{http_code}" -k -d "grant_type=password&username=admin&password=admin&scope=$STORE_SCOPE" -H "Authorization: Basic $encoded_key" https://$HOST_NAME_GATEWAY/token)
StatusCheck
#echo $access_token_json
access_token=$(cat response.txt| sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="access_token"{print $2}')
echo "access token:$access_token"
sleep 2s

#getting details of an specific Appication
status_code=$(curl -s -o response.txt -w "%{http_code}" -k -H "Authorization: Bearer $access_token" "https://$HOST_NAME_APIM/$STORE_BASE_PATH/applications/?query="$APPLICATION_NAME"")
#echo $Application_Details_json
StatusCheck
sleep 2s

SOURCE_ENV="$APPLICATION_NAME"
lines=`cat response.txt | cut -d "[" -f2 | cut -d "]" -f1 | awk -v RS='},{}' -F: '{print $0}' `
while read -r line
do
	TMPNAME=`echo $line | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="name"{print $2}' `
	
	if [[ "${TMPNAME}" == "${SOURCE_ENV}" ]]
	then
		echo $line | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="applicationId"{print $2}'
		APPLICATION_ID=`echo $line | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="applicationId"{print $2}' `
		break
	fi

done <<< "$(echo -e "$lines")" 
if [ -z "$APPLICATION_ID" ]
        then
	echoBlod "Empty application Id"
	exit 1
	fi
sleep 2s

#getting production type key details of the Application
echoBold 'getting production type key details of the Application'
status_code=$(curl -s -o response.txt -w "%{http_code}" -k -H "Authorization: Bearer $access_token" "https://$HOST_NAME_APIM/$STORE_BASE_PATH/applications/$APPLICATION_ID/keys/PRODUCTION")
#echo $Key_Details_json
StatusCheck
sleep 2s

#getting the consumerKey
consumerKey=$(cat response.txt | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="consumerKey"{print $2}')
echo "consumerKey:$consumerKey"
#getting the consumer secrect 
consumerSecret=$(cat response.txt | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="consumerSecret"{print $2}')
echo "consumerSecret:$consumerSecret"
sleep 2s

echoBold ' encoding consumerKey and consumerSecret..... '
#Base64 encoded in the format consumer-key:consumer-secret
encode_consumerKey="$consumerKey:$consumerSecret"
if [ -z "$consumerKey" ] && [ -z "$consumerSecret" ]
        then
	echo "Empty consumerId & consumerSecret"
	exit 1
	fi

encoded_consumerKey=$(echo -n $encode_consumerKey | base64)
echoBold "encoded key:$encoded_consumerKey"

echoBold ' Generating access token..... '
status_code=$(curl -s -o token.txt -w "%{http_code}" -k -d "grant_type=password&username=admin&password=admin&scope=$STORE_SCOPE" -H "Authorization: Basic $encoded_consumerKey" https://$HOST_NAME_GATEWAY/token)
#echo $token_json
StatusCheck
token=$(cat token.txt | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="access_token"{print $2}')
echo "access token:$token"



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

# this scripts automates the API creation and pulish
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

source publisher_config.txt

echoBold ' Obtaining the consumer key/secret key pair...... '

status_code="$(curl -s -o response.txt -w "%{http_code}" -k -X POST -H "Authorization: Basic YWRtaW46YWRtaW4=" -H "Content-Type: application/json" -d @payload.json https://$HOST_NAME_APIM/client-registration/v0.14/register)"
StatusCheck

#getting the client Id
clientId=$(cat response.txt| sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="clientId"{print $2}')
echo "clientId:$clientId"

#getting the client secrect 
clientSecret=$(cat response.txt  | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="clientSecret"{print $2}')
echo "clientSecret:$clientSecret"

if [ -z "$clientId" ] && [ -z "$clientSecret" ]
        then
	echoBold "Empty clientId & clientSecret"
	exit 1
	fi
echoBold ' encoding clientId and ClientSecrect..... '
#Base64 encoded in the format consumer-key:consumer-secret
encode_key="$clientId:$clientSecret"
#echo "encode key:$encode_key"
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
status_code="$(curl -s -o response.txt -w "%{http_code}" -k -d "grant_type=password&username=admin&password=admin&scope=$PUBLISHER_SCOPE" -H "Authorization: Basic $encoded_key" https://$HOST_NAME_GATWAY/token)"
StatusCheck

access_token=$(cat response.txt | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="access_token"{print $2}')
echo "access token:$access_token"

if [ -z "$access_token" ] 
        then
	echoBold "Empty Token"
	exit 1
	fi

echoBold ' Creating new API...... '
status_code="$(curl -s -o response.txt -w "%{http_code}" -k -H "Authorization: Bearer $access_token" -H "Content-Type: application/json" -X POST -d @$DATA_FILE https://$HOST_NAME_APIM/$PUBLISHER_BASE_PATH/apis)"
StatusCheck

ids=$(cat response.txt | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="id"{print $2}')
echo $ids
api_id=$(echo $ids | awk '{print $1}')
echo "API Id:$api_id"
if [ -z "$api_id" ] 
        then
	echo "API is not created"
	exit 1
	fi
sleep 2s
echoBold 'Uploading thumbnail Image.......'
status_code=$(curl -s -o response.txt -w "%{http_code}" -k -X POST -H "Authorization: Bearer $access_token" https://$HOST_NAME_APIM/$PUBLISHER_BASE_PATH/apis/$api_id/thumbnail -F file=@$IMAGE)
StatusCheck

echoBold ' Changing the API Status to publish'
if [ -z "$api_id" ] 
        then
	echo "API is not created"
	exit 1
	fi
curl -k -H "Authorization: Bearer $access_token" -X POST "https://$HOST_NAME_APIM/$PUBLISHER_BASE_PATH/apis/change-lifecycle?apiId=$api_id&action=Publish" -i

sleep 2s
echoBold 'Finished API creating and Publishing'




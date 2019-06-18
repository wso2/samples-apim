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

# this scripts automates creating an Application the subscription
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

source store_config.txt

echoBold ' Obtaining the consumer key/secret key pair...... '
status_code="$(curl -s -o response.txt -w "%{http_code}" -k -X POST -H "Authorization: Basic YWRtaW46YWRtaW4=" -H "Content-Type: application/json" -d @payload.json https://$HOST_NAME_APIM/client-registration/v0.14/register)"
StatusCheck
sleep 2s

#getting the client Id
clientId=$(cat response.txt | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="clientId"{print $2}')
echoBold "clientId:$clientId"
#getting the client secrect 
clientSecret=$(cat response.txt  | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="clientSecret"{print $2}')
echoBold "clientSecret:$clientSecret"
if [ -z "$clientId" ] && [ -z "$clientSecret" ]
        then
	echoBold "Empty clientId & clientSecret"
	exit 1
	fi

echoBold ' encoding clientId and ClientSecrect..... '
#Base64 encoded in the format consumer-key:consumer-secret
encode_key="$clientId:$clientSecret"
#echo "encode key:$encode_key"
encoded_key=$(echo -n $encode_key | base64)
echoBold "encoded key:$encoded_key"
if [ -z "$encoded_key" ]
        then
	echoBlod "Empty encoded key"
	exit 1
	fi


echoBold ' Generating the access token..... '
status_code=$(curl -s -o response.txt -w "%{http_code}" -k -d "grant_type=password&username=$USERNAME&password=$PASSWORD&scope=$STORE_SCOPE" -H "Authorization: Basic $encoded_key" https://$HOST_NAME_GATEWAY/token)
StatusCheck

access_token=$(cat response.txt | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="access_token"{print $2}')
echo "access token:$access_token"
if [ -z "$access_token" ] 
        then
	echoBold "Empty Token"
	exit 1
	fi

echoBold ' Creating an Application'
status_code="$(curl -s -o response.txt -w "%{http_code}" -k -H "Authorization: Bearer $access_token" -H "Content-Type: application/json" -X POST -d @$APPLICATION_DATA_FILE "https://$HOST_NAME_APIM/$STORE_BASE_PATH/applications")"
StatusCheck

# retrieving the application Id
apllication_id=$(cat response.txt | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="applicationId"{print $2}')
echo $apllication_id
sleep 2s

#getting details of an specific API
if [ -z "$API_NAME" ] 
        then
	echoBold "Empty API Name"
	exit 1
	fi
status_code="$(curl -s -o response.txt -w "%{http_code}" -k https://$HOST_NAME_APIM/$STORE_BASE_PATH/apis/?query="name:$API_NAME")"
StatusCheck


SOURCE_ENV="$API_NAME"
lines=`cat response.txt | cut -d "[" -f2 | cut -d "]" -f1 | awk -v RS='},{}' -F: '{print $0}' `
while read -r line
do
	TMPNAME=`echo $line | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="name"{print $2}' `
	
	if [[ "${TMPNAME}" == "${SOURCE_ENV}" ]]
	then
		echo $line | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="id"{print $2}'
		API_ID=`echo $line | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="id"{print $2}' `
		break
	fi
done <<< "$(echo -e "$lines")" 

sleep 2s

echoBold 'Subscription'
#json data for new subcription
json='{"tier": "Unlimited","apiIdentifier":"'"$API_ID"'","applicationId":"'"$apllication_id"'"}'
if [ -z "$API_ID" ] && [ -z "$apllication_id" ]
        then
	echoBold "Empty apllication id & API Id"
	exit 1
	fi
echo $json
status_code=$(curl -s -o response.txt -w "%{http_code}" -k -H "Authorization: Bearer $access_token" -H "Content-Type: application/json" -X POST  -d "$json" "https://$HOST_NAME_APIM/$STORE_BASE_PATH/subscriptions")
StatusCheck
cat response.txt


echoBold 'Generating keys for application '
status_code="$(curl -s -o response.txt -w "%{http_code}" -k -H "Authorization: Bearer $access_token" -H "Content-Type: application/json" -X POST -d @application_key_data.json "https://$HOST_NAME_APIM/api/am/store/v0.14/applications/generate-keys?applicationId=$apllication_id")"
StatusCheck
cat response.txt



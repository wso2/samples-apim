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

# this scripts automates creating a throttling policy
ECHO=`which echo`
function echoBold () {
    ${ECHO} -e $'\e[1m'"${1}"$'\e[0m'
}


source admin_config.txt

echoBold ' Obtaining the consumer key/secret key pair...... '

consumes_secret_key_json="$(curl -k -X POST -H "Authorization: Basic YWRtaW46YWRtaW4=" -H "Content-Type: application/json" -d @payload.json https://$HOST_NAME_APIM/client-registration/v0.14/register)"
sleep 2s

#getting the client Id
clientId=$(echo $consumes_secret_key_json | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="clientId"{print $2}')
echo "clientId:$clientId"
#getting the client secrect 
clientSecret=$(echo $consumes_secret_key_json  | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="clientSecret"{print $2}')
echo "clientSecret:$clientSecret"

echoBold ' encoding clientId and ClientSecrect..... '
#Base64 encoded in the format consumer-key:consumer-secret
encode_key="$clientId:$clientSecret"
echo "encode key:$encode_key"
encoded_key=$(echo -n $encode_key | base64)
echoBold "encoded key:$encoded_key"

echoBold ' Generating the access token..... '
access_token_json="$(curl -k -d "grant_type=password&username=admin&password=admin&scope=$ADMIN_SCOPE" -H "Authorization: Basic $encoded_key" https://$HOST_NAME_GATEWAY/token)"
echo $access_token_json
access_token=$(echo $access_token_json | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="access_token"{print $2}')
echo "access token:$access_token"

echoBold ' Creating a throttling Policy'
curl -k -X POST -H "Authorization: Bearer $access_token" -H "Content-Type: application/json" https://$HOST_NAME_APIM/$ADMIN_BASE_PATH/throttling/policies/subscription -d @$DATA_FILE



echoBold 'Finished creating a throttling policy'

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

#this script automates invoking an API

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

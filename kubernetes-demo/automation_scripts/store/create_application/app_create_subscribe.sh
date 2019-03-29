#!/bin/bash
# this scripts automates the subscription
ECHO=`which echo`
function echoBold () {
    ${ECHO} -e $'\e[1m'"${1}"$'\e[0m'
}
source store_config.txt

echoBold ' Obtaining the consumer key/secret key pair...... '
consumes_secret_key_json="$(curl -k -X POST -H "Authorization: Basic YWRtaW46YWRtaW4=" -H "Content-Type: application/json" -d @payload.json https://$HOST_NAME/client-registration/v0.14/register)"
sleep 2s

#getting the client Id
clientId=$(echo $consumes_secret_key_json | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="clientId"{print $2}')
echoBold "clientId:$clientId"
#getting the client secrect 
clientSecret=$(echo $consumes_secret_key_json  | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="clientSecret"{print $2}')
echoBold "clientSecret:$clientSecret"

echoBold ' encoding clientId and ClientSecrect..... '
#Base64 encoded in the format consumer-key:consumer-secret
encode_key="$clientId:$clientSecret"
#echo "encode key:$encode_key"
encoded_key=$(base64 <<< $encode_key)
echoBold "encoded key:$encoded_key"

echoBold ' Generating the access token..... '
access_token_json="$(curl -k -d "grant_type=password&username=admin&password=admin&scope=$STORE_SCOPE" -H "Authorization: Basic $encoded_key" https://wso2apim-gateway/token)"
echo $access_token_json
access_token=$(echo $access_token_json | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="access_token"{print $2}')
echo "access token:$access_token"

echoBold ' Creating an Apptication'
application_json="$(curl -k -H "Authorization: Bearer $access_token" -H "Content-Type: application/json" -X POST -d @$APPLICATION_DATA_FILE "https://$HOST_NAME/$STORE_BASE_PATH/applications")"
echo $application_json
apllication_id=$(echo $application_json | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="applicationId"{print $2}')
echo $apllication_id
sleep 2s

#getting details of an specific API
API_Details_json="$(curl -k GET https://wso2apim/$STORE_BASE_PATH/apis/?query="context:vehiclemgt")"
echo $API_Details_json
API_Ids=$(echo $API_Details_json | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="list"{print $2}')
echo $API_Ids
api_id=$(echo $API_Ids | awk '{print $1}')

#echoBold 'Subscription'
#json data for new subcription
#json=$(echo "{"tier": "Gold","apiIdentifier": "$API_Id","applicationId": "$apllication_id"}")
#echo $json
#subcription_json="$(curl -k -H "Authorization: Bearer $access_token" -H "Content-Type: application/json" -X POST  -d $json "https://$HOST_NAME/$STORE_BASE_PATH/subscriptions")"
#echo $subcription_json
echoBold 'Generating keys for application '
application_keys_json="$(curl -k -H "Authorization: Bearer $access_token" -H "Content-Type: application/json" -X POST -d @application_key_data.json "https://$HOST_NAME/api/am/store/v0.14/applications/generate-keys?applicationId=$apllication_id")"
echo $application_keys_json


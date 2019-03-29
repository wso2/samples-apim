#!/bin/bash
# this scripts automates the API creation and pulish
ECHO=`which echo`
function echoBold () {
    ${ECHO} -e $'\e[1m'"${1}"$'\e[0m'
}


source publisher_config.txt

echoBold ' Obtaining the consumer key/secret key pair...... '
#curl -k -X POST -H "Authorization: Basic $password" -H "Content-Type: application/json" -d @payload.json https://$HOST_NAME/client-registration/v0.14/#register > test_key.txt

consumes_secret_key_json="$(curl -k -X POST -H "Authorization: Basic $password" -H "Content-Type: application/json" -d @payload.json https://wso2apim/client-registration/v0.14/register)"
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
#echo "encode key:$encode_key"
encoded_key=$(base64 <<< $encode_key)
echo "encoded key:$encoded_key"

echoBold ' Generating the access token..... '
access_token_json="$(curl -k -d "grant_type=password&username=admin&password=admin&scope=$PUBLISHER_SCOPE" -H "Authorization: Basic $encoded_key" https://wso2apim-gateway/token)"
echo $access_token_json
access_token=$(echo $access_token_json | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="access_token"{print $2}')
echo "access token:$access_token"

echoBold ' Creating new API...... '
created_api_json="$(curl -k -H "Authorization: Bearer $access_token" -H "Content-Type: application/json" -X POST -d @$DATA_FILE https://$HOST_NAME/$PUBLISHER_BASE_PATH/apis)"
echo $created_api_json
ids=$(echo $created_api_json | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="id"{print $2}')
echo $ids
api_id=$(echo $ids | awk '{print $1}')
echo "API Id:$api_id"
sleep 2s
echoBold 'Uploading thumbnail Image.......'
curl -k -X POST -H "Authorization: Bearer $access_token" https://$HOST_NAME/$PUBLISHER_BASE_PATH/apis/$api_id/thumbnail -F file=@$IMAGE

echoBold ' Changing the API Status to publish'
curl -k -H "Authorization: Bearer $access_token" -X POST "https://$HOST_NAME/$PUBLISHER_BASE_PATH/apis/change-lifecycle?apiId=$api_id&action=Publish"
sleep 2s




echoBold 'Finished API creating and Publishing'

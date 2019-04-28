#!/bin/bash

ECHO=`which echo`
function echoBold () {
    ${ECHO} -e $'\e[1m'"${1}"$'\e[0m'
}
source client_config.txt

echoBold ' Obtaining the consumer key/secret key pair...... '
consumes_secret_key_json="$(curl -k -X POST -H "Authorization: Basic YWRtaW46YWRtaW4=" -H "Content-Type: application/json" -d @payload.json https://$HOST_NAME_APIM/client-registration/v0.14/register)"
echoBold $consumes_secret_key_json
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
echo "encode key:$encode_key"
encoded_key=$(echo -n $encode_key | base64)
echoBold "encoded key:$encoded_key"

echoBold ' Generating the access token..... '
access_token_json=$(curl -k -d "grant_type=password&username=admin&password=admin&scope=$STORE_SCOPE" -H "Authorization: Basic $encoded_key" https://$HOST_NAME_GATEWAY/token)
echo $access_token_json
access_token=$(echo $access_token_json | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="access_token"{print $2}')
echo "access token:$access_token"
sleep 2s

#getting details of an specific Appication
Application_Details_json=$(curl -k -H "Authorization: Bearer $access_token" "https://$HOST_NAME_APIM/$STORE_BASE_PATH/applications/?query="$APPLICATION_NAME"")
echo $Application_Details_json
sleep 2s

SOURCE_ENV="$APPLICATION_NAME"
lines=`echo ${Application_Details_json} | cut -d "[" -f2 | cut -d "]" -f1 | awk -v RS='},{}' -F: '{print $0}' `
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
sleep 2s

#getting production type key details of the Application
echoBold 'getting production type key details of the Application'
Key_Details_json=$(curl -k -H "Authorization: Bearer $access_token" "https://$HOST_NAME_APIM/$STORE_BASE_PATH/applications/$APPLICATION_ID/keys/PRODUCTION")
echo $Key_Details_json
sleep 2s
#getting the consumerKey
consumerKey=$(echo $Key_Details_json | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="consumerKey"{print $2}')
echo "consumerKey:$consumerKey"
#getting the consumer secrect 
consumerSecret=$(echo $Key_Details_json | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="consumerSecret"{print $2}')
echo "consumerSecret:$consumerSecret"
sleep 2s

echoBold ' encoding consumerKey and consumerSecret..... '
#Base64 encoded in the format consumer-key:consumer-secret
encode_consumerKey="$consumerKey:$consumerSecret"
#echo "encode key:$encode_key"
encoded_consumerKey=$(echo -n $encode_consumerKey | base64)
echoBold "encoded key:$encoded_consumerKey"

echoBold ' Generating the access token..... '
token_json=$(curl -k -d "grant_type=password&username=admin&password=admin&scope=$STORE_SCOPE" -H "Authorization: Basic $encoded_consumerKey" https://$HOST_NAME_GATEWAY/token)
echo $token_json
token=$(echo $token_json | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="access_token"{print $2}')
echo "access token:$token"

echoBold "envoking...."
for num in {0..1}
do
status=$(curl -s -o /dev/null -w "%{http_code}\\n" -k -X GET "https://$HOST_NAME_GATEWAY/hello/1.0.0/" -H  "accept: application/json" -H  "Authorization: Bearer $token") 
echoBold $status
if [[ $status -eq 401 ]]
	then
	echoBold "true"
	echoBold ' Generating the access token..... '
	token_status=$(curl -s -o /dev/null -w "%{http_code}\\n" -k -d "grant_type=password&username=admin&password=admin&scope=$STORE_SCOPE" -H "Authorization: Basic $encoded_consumerKey" https://$HOST_NAME_GATEWAY/token)
	echo $token_status
	if [[ ! $token_status -eq 200 ]]
		then
		echoBold "error ,excuting again"
		./helloClient.sh
		else
			token_json=$(curl -k -d "grant_type=password&username=admin&password=admin&scope=$STORE_SCOPE" -H "Authorization: Basic $encoded_consumerKey" https://$HOST_NAME_GATEWAY/token)
			echo $token_json
			token=$(echo $token_json | sed -e 's/[{}]/''/g' | sed s/\"//g | awk -v RS=',' -F: '$1=="access_token"{print $2}')
			echo "access token:$token"
			echoBold "envoking after Generating a new token...."
			curl -k -X GET "https://$HOST_NAME_GATEWAY/hello/1.0.0/" -H  "accept: application/json" -H  "Authorization: Bearer $token"
			fi
else
	echoBold 'false'
	curl -k -X GET "https://$HOST_NAME_GATEWAY/hello/1.0.0/" -H  "accept: application/json" -H  "Authorization: Bearer $token"

fi
done

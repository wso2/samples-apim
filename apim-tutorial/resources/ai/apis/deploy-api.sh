#!/bin/bash
apim=20.41.233.10
port=9443
echo "+++++++++ creating GOGO resources +++++++++++"
client_request() {
    cat <<EOF
{
    "callbackUrl": "wso2.org",
    "clientName": "setup_apim_script",
    "tokenScope": "Production",
    "owner": "admin",
    "grantType": "password refresh_token",
    "saasApp": true
}
EOF
}
client_credentials=$(curl -k -u admin:admin -H "Content-Type: application/json" -d "$(client_request)" https://$apim:$port/client-registration/v0.17/register| jq -r '.clientId + ":" + .clientSecret')
#echo $client_credentials
get_access_token() {
    local access_token=$(curl -k -d "grant_type=password&username=$1&password=$2&scope=apim:api_view apim:api_publish apim:api_create apim:subscribe apim:publisher_settings" -u $client_credentials https://$apim:$port/oauth2/token | jq -r '.access_token')
    echo $access_token
}
pub_access_token=$(get_access_token 'admin' 'admin')
admin_access_token=$(get_access_token 'admin' 'admin')
get_vhost() {
    local vhost=$(curl -k -H "Authorization: Bearer $admin_access_token" https:///$apim:$port/api/am/publisher/settings | jq -r '.environment[0].vhosts[0].host')
    echo $vhost
}
vhost=$(get_vhost)

## create and publish
create_and_publish_rest_api() {

    local api_id=$(curl -k -H "Authorization: Bearer $pub_access_token" -H "Content-Type: application/json" -X POST -d @data.json https:///$apim:$port/api/am/publisher/apis | jq -r '.id')
    local swagger=$(curl -k -H "Authorization: Bearer $pub_access_token" -H "multipart/form-data" -X PUT -F apiDefinition=@swagger.json https://$apim:$port/api/am/publisher/apis/${api_id}/swagger | jq -r '.id')
    local rev_id=$( curl -k -H "Authorization: Bearer $pub_access_token" -H "Content-Type: application/json" -X POST -d '{"description": "first revision"}' https://$apim:$port/api/am/publisher/apis/${api_id}/revisions | jq -r '.id')

    #add image
    local image_id=$(curl -k -H "Authorization: Bearer $pub_access_token" -H "multipart/form-data" -X PUT -F file=@icon.png https://$apim:$port/api/am/publisher/apis/${api_id}/thumbnail | jq -r '.id')
    
    local revisionUuid=$( curl -k -H "Authorization: Bearer $pub_access_token" -H "Content-Type: application/json" -X POST -d '[{"name": "Default", "vhost": "'$vhost'","displayOnDevportal": true}]' https://$apim:$port/api/am/publisher/apis/${api_id}/deploy-revision?revisionId=${rev_id} | jq -r '.[0].revisionUuid')
    local publish_api_status="$(curl -k -H "Authorization: Bearer $pub_access_token" -X POST "https://$apim:$port/api/am/publisher/apis/change-lifecycle?apiId=${api_id}&action=Publish")"
    sleep 2
    echo $api_i
}


cd payment
api_id=$(create_and_publish_rest_api)

cd ../maintenance
api_id=$(create_and_publish_rest_api)

cd ../infodesk
api_id=$(create_and_publish_rest_api)

cd ..

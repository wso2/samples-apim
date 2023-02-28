#!/bin/bash
#apim=localhost
echo "+++++++++ creating RailCo resources +++++++++++"
client_request() {
    cat <<EOF
{
    "callbackUrl": "wso2.org",
    "clientName": "setup_apim_script",
    "tokenScope": "Production",
    "owner": "admin@railco.com",
    "grantType": "password refresh_token",
    "saasApp": true
}
EOF
}
client_credentials=$(curl -k -u admin@railco.com:admin -H "Content-Type: application/json" -d "$(client_request)" https://$apim:9443/client-registration/v0.17/register| jq -r '.clientId + ":" + .clientSecret')
#echo $client_credentials
get_access_token() {
    local access_token=$(curl -k -d "grant_type=password&username=$1&password=$2&scope=apim:api_view apim:api_publish apim:api_create apim:subscribe apim:publisher_settings" -u $client_credentials https://$apim:9443/oauth2/token | jq -r '.access_token')
    echo $access_token
}

admin_access_token=$(get_access_token 'admin@railco.com' 'admin')
echo $admin_access_token

pub_access_token=$(get_access_token 'jill@railco.com' 'user123')
echo $pub_access_token

get_vhost() {
    local vhost=$(curl -k -H "Authorization: Bearer $admin_access_token" https:///$apim:9443/api/am/publisher/v4/settings | jq -r '.environment[0].vhosts[0].host')
    echo $vhost
}
vhost=$(get_vhost)

## create and publish
create_and_publish_api() {

    local api_id=$(curl -k -H "Authorization: Bearer $pub_access_token" -H "Content-Type: application/json" -X POST -d @data.json https:///$apim:9443/api/am/publisher/v4/apis | jq -r '.id')
    local swagger=$(curl -k -H "Authorization: Bearer $pub_access_token" -H "multipart/form-data" -X PUT -F apiDefinition=@swagger.json https://$apim:9443/api/am/publisher/v4/apis/${api_id}/swagger | jq -r '.id')
    local rev_id=$( curl -k -H "Authorization: Bearer $pub_access_token" -H "Content-Type: application/json" -X POST -d '{"description": "first revision"}' https://$apim:9443/api/am/publisher/v4/apis/${api_id}/revisions | jq -r '.id')

    #add image
    local image_id=$(curl -k -H "Authorization: Bearer $pub_access_token" -H "multipart/form-data" -X PUT -F file=@icon.png https://$apim:9443/api/am/publisher/v4/apis/${api_id}/thumbnail | jq -r '.id')

    local revisionUuid=$( curl -k -H "Authorization: Bearer $pub_access_token" -H "Content-Type: application/json" -X POST -d '[{"name": "Default","vhost" : "'$vhost'",  "displayOnDevportal": true}]' https://$apim:9443/api/am/publisher/v4/apis/${api_id}/deploy-revision?revisionId=${rev_id} | jq -r '.[0].revisionUuid')
    local publish_api_status=$(curl -k -H "Authorization: Bearer $pub_access_token" -X POST "https://$apim:9443/api/am/publisher/v4/apis/change-lifecycle?apiId=${api_id}&action=Publish")
    sleep 2
    echo $api_id
}

create_app_and_subscribe(){
    local application_id=$(curl -k -H "Authorization: Bearer $tom_access_token" -H "Content-Type: application/json" -X POST -d '{"name":"KeyCloakAPP","throttlingPolicy":"Unlimited","description":"","tokenType":"JWT","groups":null,"attributes":{}}' https://$apim:9443/api/am/devportal/v3/applications | jq -r '.applicationId')
    local sub_id=$(curl -k -H "Authorization: Bearer $tom_access_token" -H "Content-Type: application/json" -X POST -d '{"apiId":"'$api_id'","applicationId":"'$application_id'","throttlingPolicy":"Unlimited"}' https://$apim:9443/api/am/devportal/v3/subscriptions)
}

cd train/
api_id=$(create_and_publish_api)

tom_access_token=$(get_access_token 'tom@railco.com' 'user123')
create_app_and_subscribe 

cd ../employee/
create_and_publish_api

cd ../metrics/
create_and_publish_api

cd ../

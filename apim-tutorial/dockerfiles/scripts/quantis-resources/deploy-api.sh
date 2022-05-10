#!/bin/bash
#apim=localhost
echo "+++++++++ creating Quantis resources +++++++++++"
client_request() {
    cat <<EOF
{
    "callbackUrl": "wso2.org",
    "clientName": "setup_apim_script",
    "tokenScope": "Production",
    "owner": "admin@quantis.com",
    "grantType": "password refresh_token",
    "saasApp": true
}
EOF
}
client_credentials=$(curl -k -u admin@quantis.com:admin -H "Content-Type: application/json" -d "$(client_request)" https://$apim:9443/client-registration/v0.17/register| jq -r '.clientId + ":" + .clientSecret')
#echo $client_credentials
get_access_token() {
    local access_token=$(curl -k -d "grant_type=password&username=$1&password=$2&scope=apim:api_view apim:api_publish apim:api_create apim:subscribe apim:publisher_settings" -u $client_credentials https://$apim:9443/oauth2/token | jq -r '.access_token')
    echo $access_token
}

admin_access_token=$(get_access_token 'admin@quantis.com' 'admin')
echo $admin_access_token

pub_access_token=$(get_access_token 'andy@quantis.com' 'user123')
echo $pub_access_token

get_vhost() {
    local vhost=$(curl -k -H "Authorization: Bearer $admin_access_token" https:///$apim:9443/api/am/publisher/v3/settings | jq -r '.environment[0].vhosts[0].host')
    echo $vhost
}
vhost=$(get_vhost)
rate_and_comment(){
    local rating_id=$(curl -k -H "Authorization: Bearer $1" -H "Content-Type: application/json" -X PUT -d '{"rating":'$3'}' https://$apim:9443/api/am/devportal/v2/apis/$2/user-rating | jq -r '.ratingId')
    local comment_id=$(curl -k -H "Authorization: Bearer $1" -H "Content-Type: application/json" -X POST -d @$4.json https://$apim:9443/api/am/devportal/v2/apis/$2/comments | jq -r '.id')
    
}
rate_and_comment_and_reply(){
    local rating_id=$(curl -k -H "Authorization: Bearer $1" -H "Content-Type: application/json" -X PUT -d '{"rating":'$3'}' https://$apim:9443/api/am/devportal/v2/apis/$2/user-rating | jq -r '.ratingId')
    local comment_id=$(curl -k -H "Authorization: Bearer $1" -H "Content-Type: application/json" -X POST -d @$4.json https://$apim:9443/api/am/devportal/v2/apis/$2/comments | jq -r '.id')
    local reply=$(curl -k -H "Authorization: Bearer $5" -H "Content-Type: application/json" -X POST -d'{"content":"Thanks 😊","category":"general"}' https://$apim:9443/api/am/devportal/v2/apis/$2/comments?replyTo=$comment_id | jq -r '.id')

}
## create and publish
create_and_publish_train_schedule_api() {

    local api_id=$(curl -k -H "Authorization: Bearer $pub_access_token" -H "Content-Type: application/json" -X POST -d @data.json https:///$apim:9443/api/am/publisher/v3/apis | jq -r '.id')
    local swagger=$(curl -k -H "Authorization: Bearer $pub_access_token" -H "multipart/form-data" -X PUT -F apiDefinition=@swagger.json https://$apim:9443/api/am/publisher/v3/apis/${api_id}/swagger | jq -r '.id')
    local rev_id=$( curl -k -H "Authorization: Bearer $pub_access_token" -H "Content-Type: application/json" -X POST -d '{"description": "first revision"}' https://$apim:9443/api/am/publisher/v3/apis/${api_id}/revisions | jq -r '.id')

    #add image
    local image_id=$(curl -k -H "Authorization: Bearer $pub_access_token" -H "multipart/form-data" -X PUT -F file=@icon.png https://$apim:9443/api/am/publisher/v3/apis/${api_id}/thumbnail | jq -r '.id')

    #add docs
    local documentId=$(curl -k -H "Authorization: Bearer $pub_access_token" -H "Content-Type: application/json" -X POST -d '{"name":"HowToUse","type":"HOWTO","summary":"How to Use Quantis Train API","sourceType":"FILE","visibility":"API_LEVEL","sourceUrl":"","otherTypeName":null,"inlineContent":""}' https://$apim:9443/api/am/publisher/v3/apis/${api_id}/documents | jq -r '.documentId')
    local content_id=$(curl -k -H "Authorization: Bearer $pub_access_token" -H "multipart/form-data" -X POST -F file=@Quantis_Train_API_v1.pdf https://$apim:9443/api/am/publisher/v3/apis/${api_id}/documents/${documentId}/content | jq -r '.id')


    local revisionUuid=$( curl -k -H "Authorization: Bearer $pub_access_token" -H "Content-Type: application/json" -X POST -d '[{"name": "Default","vhost" : "'$vhost'", "displayOnDevportal": true}]' https://$apim:9443/api/am/publisher/v3/apis/${api_id}/deploy-revision?revisionId=${rev_id} | jq -r '.[0].revisionUuid')
    local publish_api_status="$(curl -k -H "Authorization: Bearer $pub_access_token" -X POST "https://$apim:9443/api/am/publisher/v3/apis/change-lifecycle?apiId=${api_id}&action=Publish")"
    sleep 2
    echo $api_id
}

## create and publish
create_and_publish_train_location_api() {

    local api_id=$(curl -k -H "Authorization: Bearer $pub_access_token" -H "Content-Type: application/json" -X POST -d @data.json https://$apim:9443/api/am/publisher/v3/apis | jq -r '.id')
    local asyncapidefintion=$(curl -k -H "Authorization: Bearer $pub_access_token" -H "multipart/form-data" -X PUT -F apiDefinition=@asyncapi.json https://$apim:9443/api/am/publisher/v3/apis/${api_id}/asyncapi | jq -r '.id')
    local rev_id=$( curl -k -H "Authorization: Bearer $pub_access_token" -H "Content-Type: application/json" -X POST -d '{"description": "first revision"}' https://$apim:9443/api/am/publisher/v3/apis/${api_id}/revisions | jq -r '.id')

    #add image
    local image_id=$(curl -k -H "Authorization: Bearer $pub_access_token" -H "multipart/form-data" -X PUT -F file=@icon.png https://$apim:9443/api/am/publisher/v3/apis/${api_id}/thumbnail | jq -r '.id')

    local revisionUuid=$( curl -k -H "Authorization: Bearer $pub_access_token" -H "Content-Type: application/json" -X POST -d '[{"name": "Default", "vhost" : "'$vhost'", "displayOnDevportal": true}]' https://$apim:9443/api/am/publisher/v3/apis/${api_id}/deploy-revision?revisionId=${rev_id} | jq -r '.[0].revisionUuid')
    local publish_api_status="$(curl -k -H "Authorization: Bearer $pub_access_token" -X POST "https://$apim:9443/api/am/publisher/v3/apis/change-lifecycle?apiId=${api_id}&action=Publish")"
    sleep 2
    echo $api_id
}

# Create TrainSchedule API related resources 
cd trainschedule/
api_id=$(create_and_publish_train_schedule_api)

# bob comment and rate the api
bob_access_token=$(get_access_token 'bob@quantis.com' 'user123')
rate_and_comment $bob_access_token $api_id 5 "bob-comment"

# logan comment and rate the api
logan_access_token=$(get_access_token 'logan@quantis.com' 'user123')
rate_and_comment $logan_access_token $api_id 4 "logan-comment"

# sindy comment and rate the api and devuser replying to the comment
sindy_access_token=$(get_access_token 'sindy@quantis.com' 'user123')
dev_access_token=$(get_access_token 'devuser@quantis.com' 'user123')
rate_and_comment_and_reply $sindy_access_token $api_id 5 "sindy-comment" $dev_access_token

cd ../trainlocation
sleep 2

# Create TrainLocation API related resources 
api_id=$(create_and_publish_train_location_api)
cd ../

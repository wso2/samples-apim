#!/bin/bash
#host="localhost"
# export KEYCLOAK_HOST=localhost

echo "++++++++++++++++++++++++++ setup keycloak +++++++++++++++++++++++++"
host=$KEYCLOAK_HOST
username="admin"
password="admin"
scope="default"
client_name="apim-client"

access_token=$(curl -d "client_id=admin-cli" -d "username=$username" -d "password=$password" -d "grant_type=password" "http://$host:8080/auth/realms/master/protocol/openid-connect/token" | jq -r '.access_token')

## create scope
curl -X POST http://$host:8080/auth/admin/realms/master/client-scopes  -H 'Content-Type: application/json' -H "Authorization: Bearer $access_token" -d '{
   "attributes":{
      "display.on.consent.screen":"true",
      "include.in.token.scope":"true"
   },
   "name":"'$scope'",
   "protocol":"openid-connect"
}'

## scope id
scope_id=$(curl -X GET http://$host:8080/auth/admin/realms/master/client-scopes -H 'Content-Type: application/json' -H "Authorization: Bearer $access_token" | jq -r '.[]| select(.name == "'$scope'") | .id')

## create apim-client
curl -X POST http://$host:8080/auth/admin/realms/master/clients  -H 'Content-Type: application/json' -H "Authorization: Bearer $access_token" -d '{
   "enabled":true,
   "attributes":{
      
   },
   "redirectUris":[
      
   ],
   "clientId":"'$client_name'",
   "protocol":"openid-connect"
}'

## get client id
client_id=$(curl -X GET http://$host:8080/auth/admin/realms/master/clients?clientId=$client_name -H 'Content-Type: application/json' -H "Authorization: Bearer $access_token" | jq -r '.[0]|.id')

## update application
curl -X PUT http://$host:8080/auth/admin/realms/master/clients/$client_id  -H 'Content-Type: application/json' -H "Authorization: Bearer $access_token" -d '{

    "surrogateAuthRequired":false,
    "enabled":true,
    "alwaysDisplayInConsole":false,
    "clientAuthenticatorType":"client-secret",
    "redirectUris":[
       "https://localhost:9443/"
    ],
    "webOrigins":[
       
    ],
    "notBefore":0,
    "bearerOnly":false,
    "consentRequired":false,
    "standardFlowEnabled":true,
    "implicitFlowEnabled":false,
    "directAccessGrantsEnabled":true,
    "serviceAccountsEnabled":true,
    "publicClient":false,
    "frontchannelLogout":false,
    "protocol":"openid-connect",
    "attributes":{
       "access.token.lifespan":216000,
       "saml.server.signature":"false",
       "saml.server.signature.keyinfo.ext":"false",
       "saml.assertion.signature":"false",
       "saml.client.signature":"false",
       "saml.encrypt":"false",
       "saml.authnstatement":"false",
       "saml.onetimeuse.condition":"false",
       "saml_force_name_id_format":"false",
       "saml.multivalued.roles":"false",
       "saml.force.post.binding":"false",
       "exclude.session.state.from.auth.response":"false",
       "tls.client.certificate.bound.access.tokens":"false",
       "display.on.consent.screen":"false"
    },
    "authenticationFlowBindingOverrides":{
       
    },
    "fullScopeAllowed":true,
    "nodeReRegistrationTimeout":-1,
    "defaultClientScopes":[
       "web-origins",
       "role_list",
       "roles",
       "profile",
       "email"
    ],
    "optionalClientScopes":[
       "address",
       "phone",
       "offline_access",
       "microprofile-jwt"
    ],
    "access":{
       "view":true,
       "configure":true,
       "manage":true
    },
    "authorizationServicesEnabled":""
 }'

 ## update client scope

 curl -X PUT http://$host:8080/auth/admin/realms/master/clients/$client_id/default-client-scopes/$scope_id  -H 'Content-Type: application/json' -H "Authorization: Bearer $access_token" -d '{
   "realm":"master",
   "client":"'$client_id'",
   "clientScopeId":"'$scope_id'"
 }'

## get the admin role id
admin_role_id=$(curl -X GET http://$host:8080/auth/admin/realms/master/roles -H 'Content-Type: application/json' -H "Authorization: Bearer $access_token" | jq -r '.[]| select(.name == "admin") | .id')


## get service account user id
sv_usr_id=$(curl -X GET http://$host:8080/auth/admin/realms/master/clients/$client_id/service-account-user -H 'Content-Type: application/json' -H "Authorization: Bearer $access_token" | jq -r '.id')

## update service account
curl -X POST http://$host:8080/auth/admin/realms/master/users/$sv_usr_id/role-mappings/realm  -H 'Content-Type: application/json' -H "Authorization: Bearer $access_token" -d '[
   {
      "id":"'$admin_role_id'",
      "name":"admin",
      "description":"${role_admin}",
      "composite":true,
      "clientRole":false,
      "containerId":"master"
   }
]'

## generate client secret
secret=$(curl -X POST http://$host:8080/auth/admin/realms/master/clients/$client_id/client-secret  -H 'Content-Type: application/json' -H "Authorization: Bearer $access_token" -d '{"realm":"master","client":"'$client_id'"}' | jq -r '.value' )


echo "====================================================="
echo ""
echo "client id    : " $client_name
echo "client secret: " $secret
echo ""
echo "====================================================="
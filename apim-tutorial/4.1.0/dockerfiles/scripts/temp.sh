#!/bin/bash
#apim="localhost" # local testing uncomment this
create_tenant(){
curl -X POST -k \
  https://$apim:9443/services/TenantMgtAdminService \
  -H 'Authorization: Basic YWRtaW46YWRtaW4=' \
  -H 'Content-Type: text/xml' \
  -H 'SOAPAction: \"urn:addTenant\"' \
  -d '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://services.mgt.tenant.carbon.wso2.org" xmlns:xsd="http://beans.common.stratos.carbon.wso2.org/xsd">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:addTenant>
         <ser:tenantInfoBean>
            <xsd:active>true</xsd:active>
            <xsd:admin>admin</xsd:admin>
            <xsd:adminPassword>admin</xsd:adminPassword>
            <xsd:email>'$3'</xsd:email>
            <xsd:firstname>'$1'</xsd:firstname>
            <xsd:lastname>'$1'</xsd:lastname>
            <xsd:tenantDomain>'$2'</xsd:tenantDomain>
         </ser:tenantInfoBean>
      </ser:addTenant>
   </soapenv:Body>
</soapenv:Envelope>'
}

function addUserWithRole () {
    curl -k -X POST \
            https://$apim:9443/services/UserAdmin \
            -u $1:$2 \
            -H 'Content-Type: text/xml' \
            -H 'SOAPAction: "urn:addUser"' \
            -d '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://org.apache.axis2/xsd" xmlns:xsd1="http://common.mgt.user.carbon.wso2.org/xsd">
            <soapenv:Header/>
            <soapenv:Body>
                <xsd:addUser>
                    <xsd:userName>'$3'</xsd:userName>
                    <xsd:password>user123</xsd:password>
                    <xsd:roles>'$4'</xsd:roles>
                    <xsd:roles>'$5'</xsd:roles>
                </xsd:addUser>
            </soapenv:Body>
            </soapenv:Envelope>' --write-out "%{http_code}\n" --silent --output /dev/null 
}

# create tenants
echo "Creating tenant quantis.com"
create_tenant "admin" "quantis.com" "admin@quantis.com"

echo "Adding sample users to quantis.com domain"
addUserWithRole "admin@quantis.com" "admin" "andy" "Internal/creator" "Internal/publisher"
addUserWithRole "admin@quantis.com" "admin" "bob" "Internal/subscriber" "Internal/everyone"

###
echo "Creating tenant coltrain.com"
create_tenant "admin" "coltrain.com" "admin@coltrain.com"

echo "Adding sample users to coltrain.com domain"
addUserWithRole "admin@coltrain.com" "admin" "bill" "Internal/creator" "Internal/publisher"
addUserWithRole "admin@coltrain.com" "admin" "george" "Internal/subscriber" "Internal/everyone"

###
echo "Creating tenant railco.com"
create_tenant "admin" "railco.com" "admin@railco.com"

echo "Adding sample users to railco.com domain"
addUserWithRole "admin@railco.com" "admin" "jill" "Internal/creator" "Internal/publisher"
addUserWithRole "admin@railco.com" "admin" "tom" "Internal/subscriber" "Internal/everyone"


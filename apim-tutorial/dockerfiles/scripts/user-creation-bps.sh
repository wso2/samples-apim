#!/bin/bash
#bps="localhost" # local testing uncomment this
function addUserWithRole () {
    curl -k -X POST \
            https://$bps:9445/services/UserAdmin \
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

function addUserWith1Role () {
    curl -k -X POST \
            https://$bps:9445/services/UserAdmin \
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
                </xsd:addUser>
            </soapenv:Body>
            </soapenv:Envelope>' --write-out "%{http_code}\n" --silent --output /dev/null 
}
function addRole () {
    curl -k -X POST \
            https://$bps:9445/services/UserAdmin \
            -u $1:$2 \
            -H 'Content-Type: text/xml' \
            -H 'SOAPAction: "urn:addRole"' \
            -d '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://org.apache.axis2/xsd">
                <soapenv:Header/>
                <soapenv:Body>
                    <xsd:addRole>
                        <xsd:roleName>'$3'</xsd:roleName>
                        <xsd:isSharedRole>false</xsd:isSharedRole>
                    </xsd:addRole>
                </soapenv:Body>
                </soapenv:Envelope>' --write-out "%{http_code}\n" --silent --output /dev/null 
}
##################################
addRole "admin" "admin" "ManagerRole"
addUserWithRole "admin" "admin" "Manager" "admin" "ManagerRole"
addUserWith1Role "admin" "admin" "SubManager" "admin"

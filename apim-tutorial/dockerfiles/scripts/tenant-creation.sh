#!/bin/bash
#apim="localhost" # local testing uncomment this
create_tenant(){
curl -X POST -k \
  https://$apim:$port/services/TenantMgtAdminService \
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
            https://$apim:$port/services/UserAdmin \
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

function addUserWith3Role () {
    curl -k -X POST \
            https://$apim:$port/services/UserAdmin \
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
                    <xsd:roles>'$6'</xsd:roles>
                </xsd:addUser>
            </soapenv:Body>
            </soapenv:Envelope>' --write-out "%{http_code}\n" --silent --output /dev/null 
}
function addRole () {
    curl -k -X POST \
            https://$apim:$port/services/UserAdmin \
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

function enableSignup(){
curl -X POST \
  https://$apim:$port/services/ResourceAdminService \
  -u $1:$2 \
  -H 'Content-Type: application/soap+xml;charset=UTF-8;action=\"urn:updateTextContent\"' \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ser="http://services.resource.registry.carbon.wso2.org">
   <soap:Header />
   <soap:Body>
      <ser:updateTextContent>
         <ser:resourcePath>/_system/governance/apimgt/applicationdata/sign-up-config.xml</ser:resourcePath>
         <ser:contentText>&lt;SelfSignUp&gt;

    &lt;EnableSignup&gt;true&lt;/EnableSignup&gt;

    &lt;!-- user storage to store users --&gt;
    &lt;SignUpDomain&gt;PRIMARY&lt;/SignUpDomain&gt;

    &lt;!-- Tenant admin information. (for clustered setup credentials for AuthManager) --&gt;
    &lt;AdminUserName&gt;'$1'&lt;/AdminUserName&gt;
    &lt;AdminPassword&gt;'$2'&lt;/AdminPassword&gt;

    &lt;!-- List of roles for the tenant user --&gt;
    &lt;SignUpRoles&gt;
        &lt;SignUpRole&gt;
            &lt;RoleName&gt;subscriber&lt;/RoleName&gt;
            &lt;IsExternalRole&gt;false&lt;/IsExternalRole&gt;
        &lt;/SignUpRole&gt;
    &lt;/SignUpRoles&gt;

&lt;/SelfSignUp&gt;</ser:contentText>
      </ser:updateTextContent>
   </soap:Body>
</soap:Envelope>' -k
}

function enableSingupWorkflow() {
    curl -X POST \
  https://$apim:$port/services/ResourceAdminService \
  -u $1:$2 \
  -H 'Content-Type: application/soap+xml;charset=UTF-8;action=\"urn:updateTextContent\"' \
  -d '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ser="http://services.resource.registry.carbon.wso2.org">
   <soap:Header/>
   <soap:Body>
      <ser:updateTextContent>
         <ser:resourcePath>/_system/governance/apimgt/applicationdata/workflow-extensions.xml</ser:resourcePath>
          <ser:contentText>

&lt;WorkFlowExtensions&gt;
    &lt;ApplicationCreation executor=&quot;org.wso2.carbon.apimgt.impl.workflow.ApplicationCreationSimpleWorkflowExecutor&quot;/&gt;
    &lt;!--ApplicationCreation executor=&quot;org.wso2.carbon.apimgt.impl.workflow.ApplicationCreationApprovalWorkflowExecutor&quot;/--&gt;
    &lt;ProductionApplicationRegistration executor=&quot;org.wso2.carbon.apimgt.impl.workflow.ApplicationRegistrationSimpleWorkflowExecutor&quot;/&gt;
    &lt;!--ProductionApplicationRegistration executor=&quot;org.wso2.carbon.apimgt.impl.workflow.ApplicationRegistrationApprovalWorkflowExecutor&quot;/--&gt;
    &lt;SandboxApplicationRegistration executor=&quot;org.wso2.carbon.apimgt.impl.workflow.ApplicationRegistrationSimpleWorkflowExecutor&quot;/&gt;
    &lt;!--SandboxApplicationRegistration executor=&quot;org.wso2.carbon.apimgt.impl.workflow.ApplicationRegistrationApprovalWorkflowExecutor&quot;/--&gt;
    &lt;SubscriptionCreation executor=&quot;org.wso2.carbon.apimgt.impl.workflow.SubscriptionCreationSimpleWorkflowExecutor&quot;/&gt;
    &lt;!--SubscriptionCreation executor=&quot;org.wso2.carbon.apimgt.impl.workflow.SubscriptionCreationApprovalWorkflowExecutor&quot;/--&gt;

    &lt;SubscriptionUpdate executor=&quot;org.wso2.carbon.apimgt.impl.workflow.SubscriptionUpdateSimpleWorkflowExecutor&quot;/&gt;
    &lt;!--SubscriptionUpdate executor=&quot;org.wso2.carbon.apimgt.impl.workflow.SubscriptionUpdateApprovalWorkflowExecutor&quot;/--&gt;
    &lt;!--SubscriptionUpdate executor=&quot;org.wso2.carbon.apimgt.impl.workflow.SubscriptionUpdateWSWorkflowExecutor&quot;&gt;
         &lt;Property name=&quot;serviceEndpoint&quot;&gt;http://localhost:9765/services/SubscriptionApprovalWorkFlowProcess/&lt;/Property&gt;
         &lt;Property name=&quot;username&quot;&gt;admin&lt;/Property&gt;
         &lt;Property name=&quot;password&quot;&gt;admin&lt;/Property&gt;
         &lt;Property name=&quot;callbackURL&quot;&gt;https://localhost:8243/services/WorkflowCallbackService&lt;/Property&gt;
    &lt;/SubscriptionUpdate--&gt;
    &lt;!--UserSignUp executor=&quot;org.wso2.carbon.apimgt.impl.workflow.UserSignUpSimpleWorkflowExecutor&quot;/--&gt;
    &lt;UserSignUp executor=&quot;org.wso2.carbon.apimgt.impl.workflow.UserSignUpApprovalWorkflowExecutor&quot;/&gt;

  &lt;!--
  ***NOTE:***
        Users of deletion workflows are expected to implement their own deletion workflow executors and services.
        By default API Manager only implements the core functionalities required to support deletion workflows and
        simple deletion workflow executors. Default WS deletion workflow implementations are not available with the
        distribution.
    --&gt;

    &lt;SubscriptionDeletion executor=&quot;org.wso2.carbon.apimgt.impl.workflow.SubscriptionDeletionSimpleWorkflowExecutor&quot;/&gt;
    &lt;!--SubscriptionDeletion executor=&quot;org.wso2.carbon.apimgt.impl.workflow.SubscriptionDeletionSimpleWorkflowExecutor&quot;&gt;
         &lt;Property name=&quot;serviceEndpoint&quot;&gt;http://localhost:9765/services/SubscriptionApprovalWorkFlowProcess/&lt;/Property&gt;
         &lt;Property name=&quot;username&quot;&gt;admin&lt;/Property&gt;
         &lt;Property name=&quot;password&quot;&gt;admin&lt;/Property&gt;
         &lt;Property name=&quot;callbackURL&quot;&gt;https://localhost:8243/services/WorkflowCallbackService&lt;/Property&gt;
    &lt;/SubscriptionDeletion --&gt;
    &lt;ApplicationDeletion executor=&quot;org.wso2.carbon.apimgt.impl.workflow.ApplicationDeletionSimpleWorkflowExecutor&quot;/&gt;
    &lt;!--ApplicationDeletion executor=&quot;org.wso2.carbon.apimgt.impl.workflow.ApplicationDeletionSimpleWorkflowExecutor&quot;&gt;
         &lt;Property name=&quot;serviceEndpoint&quot;&gt;http://localhost:9765/services/ApplicationApprovalWorkFlowProcess/&lt;/Property&gt;
         &lt;Property name=&quot;username&quot;&gt;admin&lt;/Property&gt;
         &lt;Property name=&quot;password&quot;&gt;admin&lt;/Property&gt;
         &lt;Property name=&quot;callbackURL&quot;&gt;https://localhost:8243/services/WorkflowCallbackService&lt;/Property&gt;
    &lt;/ApplicationDeletion--&gt;
    
    &lt;!-- Publisher related workflows --&gt;
    &lt;APIStateChange executor=&quot;org.wso2.carbon.apimgt.impl.workflow.APIStateChangeSimpleWorkflowExecutor&quot; /&gt;
    &lt;!--APIStateChange executor=&quot;org.wso2.carbon.apimgt.impl.workflow.APIStateChangeApprovalWorkflowExecutor&quot;&gt;
        &lt;Property name=&quot;stateList&quot;&gt;Created:Publish,Published:Block&lt;/Property&gt;
    &lt;/APIStateChange--&gt;

&lt;/WorkFlowExtensions&gt;


    </ser:contentText>
      </ser:updateTextContent>
   </soap:Body>
</soap:Envelope>' -k
}
####################################################################################################
# create tenants
echo "Creating tenant quantis.com"
create_tenant "admin" "quantis.com" "admin@quantis.com"
sleep 3
echo "Adding sample users to quantis.com domain"
addUserWithRole "admin@quantis.com" "admin" "andy" "Internal/creator" "Internal/publisher"
addUserWithRole "admin@quantis.com" "admin" "bob" "Internal/subscriber" "Internal/everyone"
addUserWithRole "admin@quantis.com" "admin" "logan" "Internal/subscriber" "Internal/everyone"
addUserWithRole "admin@quantis.com" "admin" "sindy" "Internal/subscriber" "Internal/everyone"
addUserWithRole "admin@quantis.com" "admin" "kate" "Internal/subscriber" "Internal/everyone"
addUserWithRole "admin@quantis.com" "admin" "apiprovider" "Internal/creator" "Internal/publisher"
addUserWithRole "admin@quantis.com" "admin" "devuser" "Internal/subscriber" "Internal/everyone"
echo "Enable signup and workflow"
#enableSignup "admin@quantis.com" "admin"
enableSingupWorkflow "admin@quantis.com" "admin"
sleep 3
###
echo "Creating tenant coltrain.com"
create_tenant "admin" "coltrain.com" "admin@coltrain.com"
sleep 3
echo "Adding roles to coltrain.com domain"
addRole "admin@coltrain.com" "admin" "schedule_admin"
addRole "admin@coltrain.com" "admin" "coltrain_employee"
echo "Adding sample users to coltrain.com domain"
addUserWithRole "admin@coltrain.com" "admin" "bill" "Internal/creator" "Internal/publisher"
addUserWith3Role "admin@coltrain.com" "admin" "george" "Internal/subscriber" "Internal/everyone" "coltrain_employee"
addUserWith3Role "admin@coltrain.com" "admin" "jenny" "Internal/subscriber" "schedule_admin" "coltrain_employee"
addUserWithRole "admin@coltrain.com" "admin" "apiprovider" "Internal/creator" "Internal/publisher"
addUserWithRole "admin@coltrain.com" "admin" "devuser" "Internal/subscriber" "Internal/everyone"
sleep 3
###
echo "Creating tenant railco.com"
create_tenant "admin" "railco.com" "admin@railco.com"
sleep 3
echo "Adding sample users to railco.com domain"
addUserWithRole "admin@railco.com" "admin" "jill" "Internal/creator" "Internal/publisher"
addUserWithRole "admin@railco.com" "admin" "tom" "Internal/subscriber" "Internal/everyone"
addUserWithRole "admin@railco.com" "admin" "apiprovider" "Internal/creator" "Internal/publisher"
addUserWithRole "admin@railco.com" "admin" "devuser" "Internal/subscriber" "Internal/everyone"
sleep 3

echo "Adding sample users to super tenant"
addRole "admin" "admin" "hr_department"
addRole "admin" "admin" "hr_admin"
addRole "admin" "admin" "marketing_department"
addUserWithRole "admin" "admin" "peter" "Internal/subscriber" "Internal/everyone"
addUserWithRole "admin" "admin" "apiprovider" "Internal/creator" "Internal/publisher"
addUserWithRole "admin" "admin" "devuser" "Internal/subscriber" "Internal/everyone"
addUserWith3Role "admin" "admin" "tom" "Internal/subscriber" "Internal/everyone" "hr_department"
addUserWith3Role "admin" "admin" "suzy" "Internal/subscriber" "hr_admin" "hr_department"
addUserWith3Role "admin" "admin" "larry" "Internal/subscriber" "Internal/everyone" "marketing_department"
sleep 3

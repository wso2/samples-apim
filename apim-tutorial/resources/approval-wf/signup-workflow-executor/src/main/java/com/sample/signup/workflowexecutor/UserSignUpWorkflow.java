package com.sample.signup.workflowexecutor;

import java.io.IOException;
import java.nio.charset.Charset;
import java.util.List;

import org.apache.axis2.util.URL;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.http.HttpEntity;
import org.apache.http.HttpHeaders;
import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.util.EntityUtils;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.wso2.carbon.apimgt.api.APIManagementException;
import org.wso2.carbon.apimgt.api.WorkflowResponse;
import org.wso2.carbon.apimgt.impl.APIConstants;
import org.wso2.carbon.apimgt.impl.APIManagerConfiguration;
import org.wso2.carbon.apimgt.impl.dto.UserRegistrationConfigDTO;
import org.wso2.carbon.apimgt.impl.dto.WorkflowDTO;
import org.wso2.carbon.apimgt.impl.dto.WorkflowProperties;
import org.wso2.carbon.apimgt.impl.internal.ServiceReferenceHolder;
import org.wso2.carbon.apimgt.impl.utils.APIUtil;
import org.wso2.carbon.apimgt.impl.utils.SelfSignUpUtil;
import org.wso2.carbon.apimgt.impl.workflow.*;
import org.wso2.carbon.utils.multitenancy.MultitenantUtils;

public class UserSignUpWorkflow extends UserSignUpWorkflowExecutor {
    private static final Log log = LogFactory.getLog(UserSignUpWorkflow.class);
    private String contentType;
    private static final String RUNTIME_INSTANCE_RESOURCE_PATH = "/runtime/process-instances";
    private String clientId;
    private String clientSecret;
    private String tokenAPI;
    private String serviceEndpoint;
    private String username;
    private String password;
    private String processDefinitionKey;
    private String stateList;
    private String authManagerUrl;
    private String subscriberRole;
    private String fullUserRole;

    @Override
    public String getWorkflowType() {
        return WorkflowConstants.WF_TYPE_AM_USER_SIGNUP;
    }

    @Override
    public WorkflowResponse execute(WorkflowDTO workflowDTO) throws WorkflowException {

        if (log.isDebugEnabled()) {
            log.debug("Executing User SignUp Webservice Workflow for " + workflowDTO.getWorkflowReference());
        }
        String action = WorkflowConstants.REGISTER_USER_WS_ACTION;

        //Get the default empty payload
        String payload = WorkflowConstants.REGISTER_USER_PAYLOAD;

        String callBackURL = workflowDTO.getCallbackUrl();
        String tenantAwareUserName = MultitenantUtils.getTenantAwareUsername(workflowDTO.getWorkflowReference());

        payload = payload.replace("$1", tenantAwareUserName);
        payload = payload.replace("$2", workflowDTO.getTenantDomain());
        payload = payload.replace("$3", workflowDTO.getExternalWorkflowReference());
        payload = payload.replace("$4", callBackURL != null ? callBackURL : "?");

        APIManagerConfiguration config = ServiceReferenceHolder.getInstance().getAPIManagerConfigurationService()
                .getAPIManagerConfiguration();
        WorkflowProperties workflowProperties = config.getWorkflowProperties();
        APIStateWorkflowDTO apiStateWorkFlowDTO = new APIStateWorkflowDTO();
        apiStateWorkFlowDTO.setWorkflowType(WorkflowConstants.WF_TYPE_AM_USER_SIGNUP);
        apiStateWorkFlowDTO.setWorkflowReference(workflowDTO.getWorkflowReference());
        apiStateWorkFlowDTO.setExternalWorkflowReference(workflowDTO.getExternalWorkflowReference());
        apiStateWorkFlowDTO.setStatus(WorkflowStatus.CREATED);
        apiStateWorkFlowDTO.setCallbackUrl(workflowProperties.getWorkflowCallbackAPI());
        apiStateWorkFlowDTO.setTenantId(workflowDTO.getTenantId());
        setOAuthApplicationInfo(apiStateWorkFlowDTO);
        String jsonPayload = buildPayloadForBPMNProcess(apiStateWorkFlowDTO);

        if (serviceEndpoint == null) {
            //Set the bps endpoint from the global configurations
            serviceEndpoint = workflowProperties.getServerUrl();
        }

        URL serviceEndpointURL = new URL(serviceEndpoint);
        HttpClient httpClient = APIUtil.getHttpClient(serviceEndpointURL.getPort(),
                serviceEndpointURL.getProtocol());
        HttpPost httpPost = new HttpPost(serviceEndpoint + RUNTIME_INSTANCE_RESOURCE_PATH);
        //Generate the basic auth header using provided user credentials
        String authHeader = getBasicAuthHeader();
        httpPost.setHeader(HttpHeaders.AUTHORIZATION, authHeader);
        StringEntity requestEntity = new StringEntity(jsonPayload, ContentType.APPLICATION_JSON);

        httpPost.setEntity(requestEntity);
        try {
            HttpResponse response = httpClient.execute(httpPost);
            if (response.getStatusLine().getStatusCode() != HttpStatus.SC_CREATED) {
                String error = "Error while starting the process:  " + response.getStatusLine().getStatusCode()
                        + " " + response.getStatusLine().getReasonPhrase();
                log.error(error);
                throw new WorkflowException(error);
            }
        } catch (ClientProtocolException e) {
            String errorMsg = "Error while creating the http client";
            log.error(errorMsg, e);
            throw new WorkflowException(errorMsg, e);
        } catch (IOException e) {
            String errorMsg = "Error while connecting to the BPMN process server from the WorkflowExecutor.";
            log.error(errorMsg, e);
            throw new WorkflowException(errorMsg, e);
        } finally {
            httpPost.reset();
        }
        super.execute(workflowDTO);
        return new GeneralWorkflowResponse();
    }

    @Override
    public WorkflowResponse complete(WorkflowDTO workflowDTO) throws WorkflowException {
        workflowDTO.setUpdatedTime(System.currentTimeMillis());

        if (log.isDebugEnabled()) {
            log.debug("User Sign Up [Complete] Workflow Invoked. Workflow ID : " +
                    workflowDTO.getExternalWorkflowReference() + "Workflow State : " +
                    workflowDTO.getStatus());
        }

        super.complete(workflowDTO);

        APIManagerConfiguration config = ServiceReferenceHolder.getInstance().getAPIManagerConfigurationService()
                .getAPIManagerConfiguration();
        String serverURL = "https://localhost:9443/services/";//config.getFirstProperty(APIConstants.AUTH_MANAGER_URL);

        String tenantDomain = workflowDTO.getTenantDomain();
        try {

            UserRegistrationConfigDTO signupConfig = SelfSignUpUtil.getSignupConfiguration(tenantDomain);

            String adminUsername = signupConfig.getAdminUserName();
            String adminPassword = signupConfig.getAdminPassword();
            if (serverURL == null) {
                throw new WorkflowException("Can't connect to the authentication manager. serverUrl is missing");
            } else if(adminUsername == null) {
                throw new WorkflowException("Can't connect to the authentication manager. adminUsername is missing");
            } else if(adminPassword == null) {
                throw new WorkflowException("Can't connect to the authentication manager. adminPassword is missing");
            }

            String tenantAwareUserName = MultitenantUtils.getTenantAwareUsername(workflowDTO.getWorkflowReference());

            if (WorkflowStatus.APPROVED.equals(workflowDTO.getStatus())) {
                try {
                    updateRolesOfUser(tenantAwareUserName, SelfSignUpUtil.getRoleNames(signupConfig), tenantDomain);
                } catch (Exception e) {

                    //updateRolesOfUser throws generic Exception. Therefore generic Exception is caught
                    throw new WorkflowException("Error while assigning role to user", e);
                }
            } else {
                try {
                    /* Remove created user */
                    deleteUser(tenantDomain, tenantAwareUserName);
                } catch (Exception e) {
                    throw new WorkflowException("Error while deleting the user", e);
                }
            }
        } catch (APIManagementException e1) {
            throw new WorkflowException("Error while accessing signup configuration", e1);
        }
        return new GeneralWorkflowResponse();
    }

    @Override
    public void cleanUpPendingTask(String workflowExtRef) throws WorkflowException {
    }

    @Override
    public List<WorkflowDTO> getWorkflowDetails(String workflowStatus) throws WorkflowException {
        return null;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getServiceEndpoint() {
        return serviceEndpoint;
    }

    public void setServiceEndpoint(String serviceEndpoint) {
        this.serviceEndpoint = serviceEndpoint;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getProcessDefinitionKey() {
        return processDefinitionKey;
    }

    public void setProcessDefinitionKey(String processDefinitionKey) {
        this.processDefinitionKey = processDefinitionKey;
    }

    public String getStateList() {
        return stateList;
    }

    public void setStateList(String stateList) {
        this.stateList = stateList;
    }

    public String getAuthManagerUrl() {
        return authManagerUrl;
    }

    public void setAuthManagerUrl(String authManagerUrl) {
        this.authManagerUrl = authManagerUrl;
    }

    public String getSubscriberRole() {
        return subscriberRole;
    }

    public void setSubscriberRole(String subscriberRole) {
        this.subscriberRole = subscriberRole;
    }

    public String getFullUserRole() {
        return fullUserRole;
    }

    public void setFullUserRole(String fullUserRole) {
        this.fullUserRole = fullUserRole;
    }

    private void setOAuthApplicationInfo(APIStateWorkflowDTO apiStateWorkFlowDTO) throws WorkflowException {
        //If credentials are not defined in the workflow-extension.xml file call dcr endpoint and generate a
        //oauth application and pass the client id and secret
        WorkflowProperties workflowProperties = ServiceReferenceHolder.getInstance().getAPIManagerConfigurationService()
                .getAPIManagerConfiguration().getWorkflowProperties();
        if (clientId == null || clientSecret == null) {

            String dcrUsername = workflowProperties.getdCREndpointUser();
            String dcrPassword = workflowProperties.getdCREndpointPassword();

            byte[] encodedAuth = Base64
                    .encodeBase64((dcrUsername + ":" + dcrPassword).getBytes(Charset.forName("ISO-8859-1")));

            JSONObject payload = new JSONObject();
            payload.put(WorkflowConstants.PayloadConstants.KEY_OAUTH_APPNAME, WorkflowConstants.WORKFLOW_OAUTH_APP_NAME);
            payload.put(WorkflowConstants.PayloadConstants.KEY_OAUTH_OWNER, dcrUsername);
            payload.put(WorkflowConstants.PayloadConstants.KEY_OAUTH_SAASAPP, "true");
            payload.put(WorkflowConstants.PayloadConstants.KEY_OAUTH_GRANT_TYPES, WorkflowConstants.WORKFLOW_OAUTH_APP_GRANT_TYPES);
            URL serviceEndpointURL = new URL(workflowProperties.getdCREndPoint());
            HttpClient httpClient = APIUtil.getHttpClient(serviceEndpointURL.getPort(),
                    serviceEndpointURL.getProtocol());
            HttpPost httpPost = new HttpPost(workflowProperties.getdCREndPoint());
            String authHeader = "Basic " + new String(encodedAuth);
            httpPost.setHeader(HttpHeaders.AUTHORIZATION, authHeader);
            StringEntity requestEntity = new StringEntity(payload.toJSONString(), ContentType.APPLICATION_JSON);

            httpPost.setEntity(requestEntity);
            try {
                HttpResponse response = httpClient.execute(httpPost);
                HttpEntity entity = response.getEntity();

                if (response.getStatusLine().getStatusCode() == HttpStatus.SC_OK
                        || response.getStatusLine().getStatusCode() == HttpStatus.SC_CREATED) {
                    String responseStr = EntityUtils.toString(entity);
                    if (log.isDebugEnabled()) {
                        log.debug("Workflow oauth app created: " + responseStr);
                    }
                    JSONParser parser = new JSONParser();
                    JSONObject obj = (JSONObject) parser.parse(responseStr);
                    clientId = (String) obj.get(WorkflowConstants.PayloadConstants.VARIABLE_CLIENTID);
                    clientSecret = (String) obj.get(WorkflowConstants.PayloadConstants.VARIABLE_CLIENTSECRET);

                } else {
                    String error = "Error while starting the process:  " + response.getStatusLine().getStatusCode()
                            + " " + response.getStatusLine().getReasonPhrase();
                    log.error(error);
                    throw new WorkflowException(error);
                }

            } catch (ClientProtocolException e) {
                String errorMsg = "Error while creating the http client";
                log.error(errorMsg, e);
                throw new WorkflowException(errorMsg, e);
            } catch (IOException e) {
                String errorMsg = "Error while connecting to dcr endpoint";
                log.error(errorMsg, e);
                throw new WorkflowException(errorMsg, e);
            } catch (ParseException e) {
                String errorMsg = "Error while parsing response from DCR endpoint";
                log.error(errorMsg, e);
                throw new WorkflowException(errorMsg, e);
            } finally {
                httpPost.reset();
            }

        }
        apiStateWorkFlowDTO.setClientId(clientId);
        apiStateWorkFlowDTO.setClientSecret(clientSecret);
        apiStateWorkFlowDTO.setScope("apim:api_workflow_approve");
        apiStateWorkFlowDTO.setTokenAPI(workflowProperties.getTokenEndPoint());
    }

    private String buildPayloadForBPMNProcess(APIStateWorkflowDTO apiStateWorkFlowDTO) {
        JSONArray variables = new JSONArray();

        JSONObject clientIdObj = new JSONObject();
        clientIdObj.put(WorkflowConstants.PayloadConstants.VARIABLE_NAME, WorkflowConstants.PayloadConstants.VARIABLE_CLIENTID);
        clientIdObj.put(WorkflowConstants.PayloadConstants.VARIABLE_VALUE, apiStateWorkFlowDTO.getClientId());
        variables.add(clientIdObj);

        JSONObject clientSecretObj = new JSONObject();
        clientSecretObj.put(WorkflowConstants.PayloadConstants.VARIABLE_NAME, WorkflowConstants.PayloadConstants.VARIABLE_CLIENTSECRET);
        clientSecretObj.put(WorkflowConstants.PayloadConstants.VARIABLE_VALUE, apiStateWorkFlowDTO.getClientSecret());
        variables.add(clientSecretObj);

        JSONObject scopeObj = new JSONObject();
        scopeObj.put(WorkflowConstants.PayloadConstants.VARIABLE_NAME, WorkflowConstants.PayloadConstants.VARIABLE_SCOPE);
        scopeObj.put(WorkflowConstants.PayloadConstants.VARIABLE_VALUE, apiStateWorkFlowDTO.getScope());
        variables.add(scopeObj);

        JSONObject tokenAPIObj = new JSONObject();
        tokenAPIObj.put(WorkflowConstants.PayloadConstants.VARIABLE_NAME, WorkflowConstants.PayloadConstants.VARIABLE_TOKENAPI);
        tokenAPIObj.put(WorkflowConstants.PayloadConstants.VARIABLE_VALUE, apiStateWorkFlowDTO.getTokenAPI());
        variables.add(tokenAPIObj);

        JSONObject apiCurrentStateObj = new JSONObject();
        apiCurrentStateObj.put(WorkflowConstants.PayloadConstants.VARIABLE_NAME, WorkflowConstants.PayloadConstants.VARIABLE_APISTATE);
        apiCurrentStateObj.put(WorkflowConstants.PayloadConstants.VARIABLE_VALUE, apiStateWorkFlowDTO.getApiCurrentState());
        variables.add(apiCurrentStateObj);

        JSONObject apiLCActionObj = new JSONObject();
        apiLCActionObj.put(WorkflowConstants.PayloadConstants.VARIABLE_NAME, WorkflowConstants.PayloadConstants.VARIABLE_API_LC_ACTION);
        apiLCActionObj.put(WorkflowConstants.PayloadConstants.VARIABLE_VALUE, apiStateWorkFlowDTO.getApiLCAction());
        variables.add(apiLCActionObj);

        JSONObject apiNameObj = new JSONObject();
        apiNameObj.put(WorkflowConstants.PayloadConstants.VARIABLE_NAME, WorkflowConstants.PayloadConstants.VARIABLE_APINAME);
        apiNameObj.put(WorkflowConstants.PayloadConstants.VARIABLE_VALUE, apiStateWorkFlowDTO.getApiName());
        variables.add(apiNameObj);

        JSONObject apiVersionObj = new JSONObject();
        apiVersionObj.put(WorkflowConstants.PayloadConstants.VARIABLE_NAME, WorkflowConstants.PayloadConstants.VARIABLE_APIVERSION);
        apiVersionObj.put(WorkflowConstants.PayloadConstants.VARIABLE_VALUE, apiStateWorkFlowDTO.getApiVersion());
        variables.add(apiVersionObj);

        JSONObject apiProviderObj = new JSONObject();
        apiProviderObj.put(WorkflowConstants.PayloadConstants.VARIABLE_NAME, WorkflowConstants.PayloadConstants.VARIABLE_APIPROVIDER);
        apiProviderObj.put(WorkflowConstants.PayloadConstants.VARIABLE_VALUE, apiStateWorkFlowDTO.getApiProvider());
        variables.add(apiProviderObj);

        JSONObject callbackUrlObj = new JSONObject();
        callbackUrlObj.put(WorkflowConstants.PayloadConstants.VARIABLE_NAME, WorkflowConstants.PayloadConstants.VARIABLE_CALLBACKURL);
        callbackUrlObj.put(WorkflowConstants.PayloadConstants.VARIABLE_VALUE, apiStateWorkFlowDTO.getCallbackUrl());
        variables.add(callbackUrlObj);

        JSONObject wfReferenceObj = new JSONObject();
        wfReferenceObj.put(WorkflowConstants.PayloadConstants.VARIABLE_NAME, WorkflowConstants.PayloadConstants.VARIABLE_WFREF);
        wfReferenceObj.put(WorkflowConstants.PayloadConstants.VARIABLE_VALUE, apiStateWorkFlowDTO.getExternalWorkflowReference());
        variables.add(wfReferenceObj);

        JSONObject invokerObj = new JSONObject();
        invokerObj.put(WorkflowConstants.PayloadConstants.VARIABLE_NAME, WorkflowConstants.PayloadConstants.VARIABLE_INVOKER);
        invokerObj.put(WorkflowConstants.PayloadConstants.VARIABLE_VALUE, apiStateWorkFlowDTO.getInvoker());
        variables.add(invokerObj);

        JSONObject userNameObj = new JSONObject();
        userNameObj.put(WorkflowConstants.PayloadConstants.VARIABLE_NAME, "userName");
        String tenantAwareUserName = MultitenantUtils.getTenantAwareUsername(apiStateWorkFlowDTO.getWorkflowReference());
        userNameObj.put(WorkflowConstants.PayloadConstants.VARIABLE_VALUE, tenantAwareUserName);
        variables.add(userNameObj);

        JSONObject authManagerUrl = new JSONObject();
        authManagerUrl.put(WorkflowConstants.PayloadConstants.VARIABLE_NAME, "authManagerUrl");
        authManagerUrl.put(WorkflowConstants.PayloadConstants.VARIABLE_VALUE, getAuthManagerUrl());
        variables.add(authManagerUrl);

        JSONObject subscriberRole = new JSONObject();
        subscriberRole.put(WorkflowConstants.PayloadConstants.VARIABLE_NAME, "subscriberRole");
        subscriberRole.put(WorkflowConstants.PayloadConstants.VARIABLE_VALUE, getSubscriberRole());
        variables.add(subscriberRole);

        JSONObject fullUserRole = new JSONObject();
        fullUserRole.put(WorkflowConstants.PayloadConstants.VARIABLE_NAME, "fullUserRole");
        fullUserRole.put(WorkflowConstants.PayloadConstants.VARIABLE_VALUE, getFullUserRole());
        variables.add(fullUserRole);

        JSONObject payload = new JSONObject();
        payload.put(WorkflowConstants.PayloadConstants.PROCESS_DEF_KEY, processDefinitionKey);
        payload.put(WorkflowConstants.PayloadConstants.TENANT_ID, apiStateWorkFlowDTO.getTenantId());
        //Set workflowreferencid to business key so we can later query the process instance using this value
        //if we want to delete the instance
        payload.put(WorkflowConstants.PayloadConstants.BUSINESS_KEY, apiStateWorkFlowDTO.getExternalWorkflowReference());
        payload.put(WorkflowConstants.PayloadConstants.VARIABLES, variables);

        System.out.println(payload.toJSONString());
        return payload.toJSONString();
    }

    private String getBasicAuthHeader() {

        //If credentials are not defined in the workflow-extension.xml file, then get the global credentials from the
        //api-manager.xml configuration
        if (username == null || password == null) {
            WorkflowProperties workflowProperties = ServiceReferenceHolder.getInstance()
                    .getAPIManagerConfigurationService().getAPIManagerConfiguration().getWorkflowProperties();

            username = workflowProperties.getServerUser();
            password = workflowProperties.getServerPassword();
        }
        byte[] encodedAuth = Base64.encodeBase64((username + ":" + password).getBytes(Charset.forName("ISO-8859-1")));
        return "Basic " + new String(encodedAuth);
    }
}



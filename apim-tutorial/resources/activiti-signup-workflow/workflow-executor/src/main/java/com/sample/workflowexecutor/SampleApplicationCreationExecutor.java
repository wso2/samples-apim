package com.sample.workflowexecutor;

import java.io.IOException;
import java.nio.charset.Charset;
import java.util.List;

import org.apache.axis2.util.URL;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.http.HttpHeaders;
import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.wso2.carbon.apimgt.api.APIManagementException;
import org.wso2.carbon.apimgt.api.WorkflowResponse;
import org.wso2.carbon.apimgt.api.model.Application;
import org.wso2.carbon.apimgt.impl.APIConstants;
import org.wso2.carbon.apimgt.impl.dao.ApiMgtDAO;
import org.wso2.carbon.apimgt.impl.dto.ApplicationWorkflowDTO;
import org.wso2.carbon.apimgt.impl.dto.WorkflowDTO;
import org.wso2.carbon.apimgt.impl.utils.APIUtil;
import org.wso2.carbon.apimgt.impl.workflow.GeneralWorkflowResponse;
import org.wso2.carbon.apimgt.impl.workflow.WorkflowConstants;
import org.wso2.carbon.apimgt.impl.workflow.WorkflowException;
import org.wso2.carbon.apimgt.impl.workflow.WorkflowExecutor;
import org.wso2.carbon.apimgt.impl.workflow.WorkflowStatus;
import org.wso2.carbon.apimgt.impl.workflow.WorkflowConstants.PayloadConstants;

public class SampleApplicationCreationExecutor extends WorkflowExecutor {

    private static final Log log = LogFactory.getLog(SampleApplicationCreationExecutor.class);
    private static final String RUNTIME_INSTANCE_RESOURCE_PATH = "/runtime/process-instances";
    private String serviceEndpoint;
    private String username;
    private String password;
    private String processDefinitionKey = "apim-workflows"; // processID of the bpmn instance
    @Override
    public String getWorkflowType() {
        return WorkflowConstants.WF_TYPE_AM_APPLICATION_CREATION;
    }
    
    @Override
    public WorkflowResponse execute(WorkflowDTO workflowDTO) throws WorkflowException {
        // TODO Auto-generated method stub
        
        URL serviceEndpointURL = new URL(serviceEndpoint);
        HttpClient httpClient = APIUtil.getHttpClient(serviceEndpointURL.getPort(),
                serviceEndpointURL.getProtocol());
        HttpPost httpPost = new HttpPost(serviceEndpoint + RUNTIME_INSTANCE_RESOURCE_PATH);
        //Generate the basic auth header using provided user credentials
        byte[] encodedAuth = Base64.encodeBase64((username + ":" + password).getBytes(Charset.forName("ISO-8859-1")));
         
        String authHeader = "Basic " + new String(encodedAuth);
        httpPost.setHeader(HttpHeaders.AUTHORIZATION, authHeader);
        
        
        String jsonPayload = getPayload(workflowDTO);
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
    
    private String getPayload(WorkflowDTO workflowDTO) {
        
        /*
         * 
         */
        JSONArray variables = new JSONArray();
        JSONObject referenceId = new JSONObject();
        referenceId.put("name", "referenceId");
        referenceId.put("value", workflowDTO.getExternalWorkflowReference());
        variables.add(referenceId);
        
        ApplicationWorkflowDTO appWorkFlowDTO = (ApplicationWorkflowDTO) workflowDTO;
        Application application = appWorkFlowDTO.getApplication();
        
        //Message to be displayed in the Activiti UI
        
        String message = "Application creation request by " + appWorkFlowDTO.getUserName() + " for application name: "
                + application.getName() + " with throttling tier: " + application.getTier();
        
        JSONObject requestMessage = new JSONObject();
        requestMessage.put("name", "request");
        requestMessage.put("value", message);
        variables.add(requestMessage);
        
        JSONObject payload = new JSONObject();
        payload.put(PayloadConstants.PROCESS_DEF_KEY, processDefinitionKey);

        // set workflowreferencid to business key so we can later query the process instance using this value
        // if we want to delete the instance
        payload.put(PayloadConstants.BUSINESS_KEY, appWorkFlowDTO.getExternalWorkflowReference());
        payload.put(PayloadConstants.VARIABLES, variables);
        return payload.toJSONString();
    }

    @Override
    public WorkflowResponse complete(WorkflowDTO workflowDTO) throws WorkflowException {
        workflowDTO.setUpdatedTime(System.currentTimeMillis());
        ApiMgtDAO dao = ApiMgtDAO.getInstance();
        try {
            if (dao.getApplicationById(Integer.parseInt(workflowDTO.getWorkflowReference())) != null) {
                super.complete(workflowDTO);
                if (log.isDebugEnabled()) {
                    String logMessage = "Application Creation [Complete] Workflow Invoked. Workflow ID : " + workflowDTO
                            .getExternalWorkflowReference() + " Workflow State : " + workflowDTO.getStatus();
                    log.debug(logMessage);
                }
                String status = null;
                if (WorkflowStatus.REJECTED.equals(workflowDTO.getStatus())) {
                    status = APIConstants.ApplicationStatus.APPLICATION_REJECTED;
                } else if (WorkflowStatus.APPROVED.equals(workflowDTO.getStatus())) {
                    status = APIConstants.ApplicationStatus.APPLICATION_APPROVED;
                }

                try {
                    dao.updateApplicationStatus(Integer.parseInt(workflowDTO.getWorkflowReference()), status);
                } catch (APIManagementException e) {
                    String msg = "Error occurred when updating the status of the Application creation process";
                    log.error(msg, e);
                    throw new WorkflowException(msg, e);
                }
            } else {
                String msg = "Application does not exist";
                throw new WorkflowException(msg);
            }
        } catch (APIManagementException e) {
            String msg = "Error occurred when retrieving the Application creation with workflow ID :" + workflowDTO
                    .getWorkflowReference();
            log.error(msg, e);
            throw new WorkflowException(msg, e);
        }
        return new GeneralWorkflowResponse();

    }

    @Override
    public List<WorkflowDTO> getWorkflowDetails(String workflowStatus) throws WorkflowException {
        // TODO Auto-generated method stub
        return null;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getProcessDefinitionKey() {
        return processDefinitionKey;
    }

    public void setProcessDefinitionKey(String processDefinitionKey) {
        this.processDefinitionKey = processDefinitionKey;
    }

}

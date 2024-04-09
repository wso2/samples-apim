package com.sample.workflowexecutor;

import java.io.IOException;
import java.nio.charset.Charset;
import java.util.ArrayList;
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
import org.wso2.carbon.apimgt.impl.dto.UserRegistrationConfigDTO;
import org.wso2.carbon.apimgt.impl.dto.WorkflowDTO;
import org.wso2.carbon.apimgt.impl.utils.APIUtil;
import org.wso2.carbon.apimgt.impl.utils.SelfSignUpUtil;
import org.wso2.carbon.apimgt.impl.workflow.GeneralWorkflowResponse;
import org.wso2.carbon.apimgt.impl.workflow.UserSignUpWorkflowExecutor;
import org.wso2.carbon.apimgt.impl.workflow.WorkflowConstants;
import org.wso2.carbon.apimgt.impl.workflow.WorkflowException;
import org.wso2.carbon.apimgt.impl.workflow.WorkflowStatus;
import org.wso2.carbon.apimgt.impl.workflow.WorkflowConstants.PayloadConstants;
import org.wso2.carbon.utils.multitenancy.MultitenantUtils;

public class ActivitiUserSignupWorkflow extends UserSignUpWorkflowExecutor {

	private static final Log log = LogFactory.getLog(ActivitiUserSignupWorkflow.class);
	private static final String RUNTIME_INSTANCE_RESOURCE_PATH = "/runtime/process-instances";
	private String serviceEndpoint;
	private String username;
	private String password;
	private String processDefinitionKey = "apim-workflows"; // processID of the bpmn instance

	@Override
	public String getWorkflowType() {
		return WorkflowConstants.WF_TYPE_AM_USER_SIGNUP;
	}

	@Override
	public List<WorkflowDTO> getWorkflowDetails(String workflowStatus) throws WorkflowException {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public WorkflowResponse execute(WorkflowDTO workflowDTO) throws WorkflowException {

		
		URL serviceEndpointURL = new URL(serviceEndpoint);
		HttpClient httpClient = APIUtil.getHttpClient(serviceEndpointURL.getPort(), serviceEndpointURL.getProtocol());
		HttpPost httpPost = new HttpPost(serviceEndpoint + RUNTIME_INSTANCE_RESOURCE_PATH);
		// Generate the basic auth header using provided user credentials
		byte[] encodedAuth = Base64.encodeBase64((username + ":" + password).getBytes(Charset.forName("ISO-8859-1")));

		String authHeader = "Basic " + new String(encodedAuth);
		httpPost.setHeader(HttpHeaders.AUTHORIZATION, authHeader);

		String jsonPayload = getPayload(workflowDTO);
		StringEntity requestEntity = new StringEntity(jsonPayload, ContentType.APPLICATION_JSON);

		httpPost.setEntity(requestEntity);
		try {
			HttpResponse response = httpClient.execute(httpPost);
			if (response.getStatusLine().getStatusCode() != HttpStatus.SC_CREATED) {
				String error = "Error while starting the process:  " + response.getStatusLine().getStatusCode() + " "
						+ response.getStatusLine().getReasonPhrase();
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
			log.debug("User Sign Up [Complete] Workflow Invoked. Workflow ID : "
					+ workflowDTO.getExternalWorkflowReference() + "Workflow State : " + workflowDTO.getStatus());
		}

		super.complete(workflowDTO);

		//String serverURL = "https://localhost:9443/services/";// config.getFirstProperty(APIConstants.AUTH_MANAGER_URL);

		String tenantDomain = workflowDTO.getTenantDomain();
		try {

			UserRegistrationConfigDTO signupConfig = SelfSignUpUtil.getSignupConfiguration(tenantDomain);
			String tenantAwareUserName = MultitenantUtils.getTenantAwareUsername(workflowDTO.getWorkflowReference());
			log.info("Signup approved user: " + tenantAwareUserName + " in tenant " + tenantDomain);
			if (WorkflowStatus.APPROVED.toString().equalsIgnoreCase(workflowDTO.getStatus().toString())) {
				try {
				    ArrayList<String> roleNamesArr = new ArrayList<String>();
				    roleNamesArr.add("Internal/subscriber");
					updateRolesOfUser(tenantAwareUserName, roleNamesArr, tenantDomain);
				} catch (Exception e) {

					// updateRolesOfUser throws generic Exception. Therefore generic Exception is
					// caught
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

	private String getPayload(WorkflowDTO workflowDTO) {

		JSONArray variables = new JSONArray();
		JSONObject referenceId = new JSONObject();
		referenceId.put("name", "referenceId");
		referenceId.put("value", workflowDTO.getExternalWorkflowReference());
		variables.add(referenceId);

		String tenantAwareUserName = MultitenantUtils.getTenantAwareUsername(workflowDTO.getWorkflowReference());
		String message = "New user signup request by done by " + tenantAwareUserName;

		JSONObject requestMessage = new JSONObject();
		requestMessage.put("name", "request");
		requestMessage.put("value", message);
		variables.add(requestMessage);

		JSONObject payload = new JSONObject();
		payload.put(PayloadConstants.PROCESS_DEF_KEY, processDefinitionKey);

		// set workflowreferencid to business key so we can later query the process
		// instance using this value
		// if we want to delete the instance
		// payload.put(PayloadConstants.BUSINESS_KEY,
		// appWorkFlowDTO.getExternalWorkflowReference());
		payload.put(PayloadConstants.VARIABLES, variables);
		return payload.toJSONString();
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

}

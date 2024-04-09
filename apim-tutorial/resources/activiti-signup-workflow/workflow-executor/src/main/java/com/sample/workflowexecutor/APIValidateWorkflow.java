package com.sample.workflowexecutor;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.apimgt.api.APIManagementException;
import org.wso2.carbon.apimgt.api.WorkflowResponse;
import org.wso2.carbon.apimgt.api.model.URITemplate;
import org.wso2.carbon.apimgt.api.model.Workflow;
import org.wso2.carbon.apimgt.impl.dao.ApiMgtDAO;
import org.wso2.carbon.apimgt.impl.dto.WorkflowDTO;
import org.wso2.carbon.apimgt.impl.workflow.APIStateChangeSimpleWorkflowExecutor;
import org.wso2.carbon.apimgt.impl.workflow.APIStateWorkflowDTO;
import org.wso2.carbon.apimgt.impl.workflow.WorkflowConstants;
import org.wso2.carbon.apimgt.impl.workflow.WorkflowException;
import org.wso2.carbon.apimgt.impl.workflow.WorkflowStatus;

/**
 * 
 * This api state change workflow checks whether a scope exist for a delete resource.
 *
 */

public class APIValidateWorkflow extends APIStateChangeSimpleWorkflowExecutor {
	private static final Log log = LogFactory.getLog(APIStateChangeSimpleWorkflowExecutor.class);

	private String apiName;

	@Override
	public String getWorkflowType() {
		return WorkflowConstants.WF_TYPE_AM_API_STATE;
	}

	@Override
	public List<WorkflowDTO> getWorkflowDetails(String workflowStatus) throws WorkflowException {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public WorkflowResponse execute(WorkflowDTO workflowDTO) throws WorkflowException {
		boolean valid = true;
		ApiMgtDAO apiMgtDAO = ApiMgtDAO.getInstance();
		APIStateWorkflowDTO apiStateWorkFlowDTO = (APIStateWorkflowDTO) workflowDTO;
		if ("Publish".equalsIgnoreCase(apiStateWorkFlowDTO.getApiLCAction())
				&& apiName.equalsIgnoreCase(apiStateWorkFlowDTO.getApiName())) {
			try {
				Set<URITemplate> templates = apiMgtDAO.getURITemplatesOfAPI(apiStateWorkFlowDTO.getApiUUID());
				for (Iterator iterator = templates.iterator(); iterator.hasNext();) {
					URITemplate uriTemplate = (URITemplate) iterator.next();
					if ("DELETE".equalsIgnoreCase(uriTemplate.getHTTPVerb()) && uriTemplate.getScope() == null) {
						log.info("Delete method does not have a scope assinged.");
						// Scope is not set for delete resource
						valid = false;
					}
				}

			} catch (APIManagementException e) {
				log.error("Error while retrieving url templates " + e);
			}
		}
		if (valid) {
			workflowDTO.setStatus(WorkflowStatus.APPROVED);
			WorkflowResponse workflowResponse = complete(workflowDTO);
			try {
				
				Workflow[] list = apiMgtDAO.getworkflows("AM_API_STATE", "REJECTED", "carbon.super");
				String ref = null;
				for (int i = 0; i < list.length; i++) {
					ref = list[i].getExternalWorkflowReference();
					apiMgtDAO.deleteWorkflowRequest(ref);
				}
				apiMgtDAO.addWorkflowEntry(workflowDTO);
			} catch (APIManagementException e) {
				throw new WorkflowException("Error while persisting workflow", e);
			}
			return workflowResponse;

		} else {
			workflowDTO.setStatus(WorkflowStatus.REJECTED);
			APIWorkflowResponse response = new APIWorkflowResponse();
			try {
				apiMgtDAO.addWorkflowEntry(workflowDTO);
			} catch (APIManagementException e) {
				throw new WorkflowException("Error while persisting workflow", e);
			}
			return response;
		}
	}

	public String getApiName() {
		return apiName;
	}

	public void setApiName(String apiName) {
		this.apiName = apiName;
	}

}

package com.sample.workflowexecutor;

import org.wso2.carbon.apimgt.api.APIManagementException;
import org.wso2.carbon.apimgt.api.WorkflowResponse;
import org.wso2.carbon.apimgt.impl.dao.ApiMgtDAO;
import org.wso2.carbon.apimgt.impl.dto.WorkflowDTO;
import org.wso2.carbon.apimgt.impl.workflow.APIStateChangeSimpleWorkflowExecutor;
import org.wso2.carbon.apimgt.impl.workflow.WorkflowConstants;
import org.wso2.carbon.apimgt.impl.workflow.WorkflowException;
import org.wso2.carbon.apimgt.impl.workflow.WorkflowStatus;

public class TestWorkflow extends APIStateChangeSimpleWorkflowExecutor {
	@Override
	public String getWorkflowType() {
		return WorkflowConstants.WF_TYPE_AM_API_STATE;
	}

	@Override
	public WorkflowResponse execute(WorkflowDTO workflowDTO) throws WorkflowException {
		ApiMgtDAO apiMgtDAO = ApiMgtDAO.getInstance();
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

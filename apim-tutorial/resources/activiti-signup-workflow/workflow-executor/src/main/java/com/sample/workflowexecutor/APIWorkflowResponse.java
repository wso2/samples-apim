package com.sample.workflowexecutor;

import org.wso2.carbon.apimgt.api.WorkflowResponse;

public class APIWorkflowResponse implements WorkflowResponse {

	@Override
	public String getJSONPayload() {
		return "{\"redirectConfirmationMsg\" : \"Validation error\"}";
	}

}

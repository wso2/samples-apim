package org.wso2.carbon.apimgt.tutorial.soapservice;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;
import org.tenet.metrics.GetMetricsRequest;
import org.tenet.metrics.GetMetricsResponse;

@Endpoint
public class ServiceEndpoint {

	private static final String NAMESPACE_URI = "http://metrics.tenet.org";

	private final ItemRepository repository;

	@Autowired
	public ServiceEndpoint(ItemRepository repository) {
		this.repository = repository;
	}

	@PayloadRoot(namespace = NAMESPACE_URI, localPart = "getMetricsRequest")
	@ResponsePayload
	public GetMetricsResponse getAllMetrics(@RequestPayload GetMetricsRequest request) {
		GetMetricsResponse resp = new GetMetricsResponse();
		resp.setSummary(repository.getSummary());
		return resp;
	}
}

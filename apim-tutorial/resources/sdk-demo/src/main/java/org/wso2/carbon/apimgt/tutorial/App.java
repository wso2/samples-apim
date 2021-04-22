package org.wso2.carbon.apimgt.tutorial;

import java.util.List;

import org.wso2.client.api.ApiClient;
import org.wso2.client.api.ApiException;
import org.wso2.client.api.QuantisTrainAPI.DefaultApi;
import org.wso2.client.model.QuantisTrainAPI.ScheduleItem;

public class App {
	public static void main(String[] args) throws ApiException {
		DefaultApi defaultApi = new DefaultApi();
		ApiClient apiClient = defaultApi.getApiClient();
		apiClient.addDefaultHeader("Accept", "application/json");
		String accessToken = args[0];
		apiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);
		apiClient.setBasePath("http://localhost:8280/t/quantis.com/t/quantis.com/quantis-schedule/1.0.0");
		defaultApi.setApiClient(apiClient);

		List<ScheduleItem> schedules = defaultApi.schedulesGet();
		System.out.println(schedules);
	}
}

package org.wso2.carbon.apimgt.tutorial.trainlocationsimulator;

import java.io.IOException;
import java.text.DecimalFormat;
import java.util.*;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
@EnableScheduling
public class TrainLocationSimulatorApplication extends SpringBootServletInitializer {
	private static String URL = "http://si-runtime:8006/location-source";
	private static Random rand = new Random();
	private static DecimalFormat df = new DecimalFormat("#.00000");

	public static void main(String[] args) throws IOException, InterruptedException {
		SpringApplication.run(TrainLocationSimulatorApplication.class);
	}

	@Scheduled(fixedRate = 5000, initialDelay = 30000)
	public static void publishEvents() {

		RestTemplate restTemplate = new RestTemplate();

		// create headers
		HttpHeaders headers = new HttpHeaders();
		// set `content-type` header
		headers.setContentType(MediaType.APPLICATION_JSON);

		// create a map for post parameters
		Map<String, Object> map = new HashMap<>();
		// Trying to generate a coordinate closer to London
		map.put("lon", Double.parseDouble(df.format(rand.nextDouble() * -1)));
		map.put("lat", Double.parseDouble(df.format(rand.nextDouble() + 50)));

		// System.out.println("Sending GPS coordinates : " + map.toString());

		// build the request
		HttpEntity<Map<String, Object>> entity = new HttpEntity<>(map, headers);

		restTemplate.postForObject(URL, entity, String.class);
	}
}

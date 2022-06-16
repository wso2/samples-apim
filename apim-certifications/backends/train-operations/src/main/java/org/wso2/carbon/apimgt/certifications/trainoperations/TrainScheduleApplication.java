package org.wso2.carbon.apimgt.certifications.trainoperations;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.Collections;
import java.util.Map;

@SpringBootApplication
public class TrainScheduleApplication {

	public static void main(String[] args) {
		System.setProperty("server.servlet.context-path", "/train-operations");
		final SpringApplication app = new SpringApplication(new Class[] { TrainScheduleApplication.class });
		app.setDefaultProperties((Map) Collections.singletonMap("server.port", 8094));
		app.setLogStartupInfo(false);
		app.run(args);
	}
}

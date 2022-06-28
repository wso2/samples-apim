package org.wso2.reservationsservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.Collections;

@SpringBootApplication
public class ReservationsServiceApplication {

    public static void main(String[] args) {
        System.setProperty("server.servlet.context-path", "/reservations-service");
        SpringApplication app = new SpringApplication(ReservationsServiceApplication.class);
        app.setDefaultProperties(Collections.singletonMap("server.port", 8095));
        app.setLogStartupInfo(false);
        app.run(args);
    }

}

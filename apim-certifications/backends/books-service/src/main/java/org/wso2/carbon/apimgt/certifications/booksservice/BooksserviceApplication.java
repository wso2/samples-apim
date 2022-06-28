package org.wso2.carbon.apimgt.certifications.booksservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.Collections;

@SpringBootApplication
public class BooksserviceApplication {

    public static void main(String[] args) {
        System.setProperty("server.servlet.context-path", "/books-service");
        SpringApplication app = new SpringApplication(BooksserviceApplication.class);
        app.setDefaultProperties(Collections.singletonMap("server.port", 8085));
        app.setLogStartupInfo(false);
        app.run(args);
    }

}

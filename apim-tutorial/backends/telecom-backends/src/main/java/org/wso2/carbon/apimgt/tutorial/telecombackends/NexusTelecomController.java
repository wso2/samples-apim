package org.wso2.carbon.apimgt.tutorial.telecombackends;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = { "*" })
@RequestMapping(value = "/nexus/v1", produces = { MediaType.APPLICATION_JSON_VALUE })
public class NexusTelecomController {

    @GetMapping({ "/metrics" })
    public String getMetrics() {
        return "{\n" +
                "  \"bookings\": {\n" +
                "    \"total\": 187,\n" +
                "    \"class-break-down\": {\n" +
                "      \"second\": 64,\n" +
                "      \"first\": 89,\n" +
                "      \"third\": 34\n" +
                "    }\n" +
                "  }\n" +
                "}";
    }
}
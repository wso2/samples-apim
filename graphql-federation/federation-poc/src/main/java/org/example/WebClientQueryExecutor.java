package org.example;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.intuit.graphql.orchestrator.batch.QueryExecutor;
import graphql.ExecutionInput;
import graphql.GraphQLContext;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

public class WebClientQueryExecutor implements QueryExecutor {
    private final WebClient webClient;
    private final String endpoint;
    public WebClientQueryExecutor(WebClient webClient, String endpoint) {
        this.webClient = webClient;
        this.endpoint = endpoint;
    }
    @Override
    public CompletableFuture<Map<String, Object>> query(ExecutionInput executionInput, GraphQLContext context) {
        System.out.println("/////////////////////////////////////////////////////////////");
        System.out.println(executionInput.getQuery());
        System.out.println(executionInput.getVariables());
        System.out.println(executionInput.getVariables());
        try {
            return executeQuery(executionInput)
                    .toFuture();
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
    private Mono<Map<String, Object>> executeQuery(final ExecutionInput executionInput) throws JsonProcessingException {
        System.out.println("-----------------------------------------------");
        System.out.println(executionInput.getQuery());
        System.out.println(endpoint);
        System.out.println(HttpHeaders.CONTENT_TYPE);
        System.out.println(MediaType.APPLICATION_JSON_VALUE);

//        String queryForExecutor = "{\"query\": \"" + executionInput.getQuery() + "\"}";

        Map<String, Object> bodyMap = new HashMap<>();
        bodyMap.put("query", executionInput.getQuery());
        bodyMap.put("variables", executionInput.getVariables());


        String graphqlQueryStr = Mapper.mapper().writeValueAsString(bodyMap);
        String queryForExecutor = "{"
                + "\"query\": \""+ executionInput.getQuery()+ "\","
                + "\"variables\": \"" + executionInput.getVariables()+ "\"}" ;

        return webClient.post()
                .uri(endpoint)
                .body(BodyInserters.fromValue(graphqlQueryStr))
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnSuccess(response -> {
                    // Print the response when it's successful
                    System.out.println("Response: " + response);
                })
                .doOnError(error -> {
                    // Print the error if there's an error
                    System.err.println("Error occurred: " + error.getMessage());
                });
    }
}





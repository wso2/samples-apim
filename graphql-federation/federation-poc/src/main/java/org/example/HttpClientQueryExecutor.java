package org.example;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.intuit.graphql.orchestrator.batch.QueryExecutor;
import graphql.ExecutionInput;
import graphql.GraphQLContext;
import org.apache.http.HttpEntity;
import org.apache.http.HttpStatus;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.util.EntityUtils;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

public class HttpClientQueryExecutor implements QueryExecutor {
    private final HttpClient httpClient;
    private final String endpoint;

    public HttpClientQueryExecutor(HttpClient httpClient, String endpoint) {
        this.httpClient = httpClient;
        this.endpoint = endpoint;
    }
    @Override
    public CompletableFuture<Map<String, Object>> query(ExecutionInput executionInput, GraphQLContext context) {
        try {
            return executeQuery(executionInput)
                    .toFuture();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
    private Mono<Map<String, Object>> executeQuery(final ExecutionInput executionInput) throws IOException {
        System.out.println("-----------------------------------------------");
        System.out.println(executionInput.getQuery());
        System.out.println(executionInput.getVariables());

        Map<String, Object> bodyMap = new HashMap<>();
        bodyMap.put("query", executionInput.getQuery());
        bodyMap.put("variables", executionInput.getVariables());

        String graphqlQueryStr = Mapper.mapper().writeValueAsString(bodyMap);

        HttpPost httpPost = new HttpPost(endpoint);
        StringEntity input = new StringEntity(graphqlQueryStr, ContentType.APPLICATION_JSON);
        httpPost.setEntity(input);

        try (CloseableHttpResponse response = (CloseableHttpResponse) httpClient.execute(httpPost)) {
            if (response.getStatusLine().getStatusCode() == HttpStatus.SC_OK) {
                HttpEntity entity = response.getEntity();
                String responseBody = EntityUtils.toString(entity);
                Map<String, Object> result = Mapper.mapper().readValue(responseBody, new TypeReference<Map<String, Object>>() {});
                return Mono.just(result);
            } else {
                throw new RuntimeException("Unexpected status code: " + response.getStatusLine().getStatusCode());
            }
        }
    }
}





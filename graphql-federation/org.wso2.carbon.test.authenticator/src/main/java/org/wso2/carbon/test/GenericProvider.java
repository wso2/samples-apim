package org.wso2.carbon.test;

import com.google.common.collect.ImmutableMap;
import com.intuit.graphql.orchestrator.ServiceProvider;
import com.intuit.graphql.orchestrator.batch.QueryExecutor;
import graphql.ExecutionInput;
import graphql.GraphQLContext;
import org.apache.http.client.HttpClient;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

public class GenericProvider implements ServiceProvider {

    private String endpoint;
    private QueryExecutor queryExecutor;
    private String schema;
    private String nameSpace;

    public GenericProvider(String endpoint, HttpClient httpClient, String schemaFilePath, String nameSpace) {
        this.endpoint = endpoint;
        this.nameSpace = nameSpace;
        this.queryExecutor = (QueryExecutor)  new HttpClientQueryExecutor(httpClient, endpoint);

        try {
            this.schema = schemaFilePath;
        } catch (Exception e) {
            throw new RuntimeException("Error reading schema file", e);
        }
    }

    @Override
    public String getNameSpace() {
        // Return namespace based on the endpoint or any other logic you have
        return this.nameSpace;
    }

    @Override
    public ServiceType getSeviceType() {
        return ServiceType.FEDERATION_SUBGRAPH;
    }

    @Override
    public Map<String, String> sdlFiles() {
        return ImmutableMap.of("schema.graphqls", schema);
    }

    @Override
    public CompletableFuture<Map<String, Object>> query(final ExecutionInput executionInput,
                                                        final GraphQLContext context) {
        return queryExecutor.query(executionInput, context);
    }

    public static String readFileAsString(String filePath) throws Exception {
        Path path = Paths.get(filePath);
        byte[] bytes = Files.readAllBytes(path);
        return new String(bytes, StandardCharsets.UTF_8);
    }
}


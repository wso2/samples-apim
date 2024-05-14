package org.wso2.carbon.test;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intuit.graphql.orchestrator.GraphQLOrchestrator;
import com.intuit.graphql.orchestrator.schema.RuntimeGraph;
import com.intuit.graphql.orchestrator.stitching.SchemaStitcher;
import graphql.ExecutionInput;
import graphql.execution.AsyncExecutionStrategy;
import graphql.execution.ExecutionStrategy;
import org.apache.axis2.AxisFault;
import org.apache.axis2.Constants;
import org.apache.http.HttpHeaders;
import org.apache.http.client.HttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.synapse.MessageContext;
import org.apache.synapse.SynapseConstants;
import org.apache.synapse.core.axis2.Axis2MessageContext;
import org.apache.synapse.core.axis2.Axis2Sender;
import org.apache.synapse.rest.AbstractHandler;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import org.apache.synapse.commons.json.JsonUtil;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

public class customGraphQLFederationHandler extends AbstractHandler {

    private static final Log log = LogFactory.getLog(customGraphQLFederationHandler.class);
    private static final HttpClient httpClient = HttpClients.createDefault();
    private static final ObjectMapper MAPPER = new ObjectMapper();
    public static final String GRAPHQL_PAYLOAD = "GRAPHQL_PAYLOAD";
    public static final String HTTP_SC = "HTTP_SC";
    public static final String NO_ENTITY_BODY = "NO_ENTITY_BODY";
    public static final String APPLICATION_JSON_MEDIA_TYPE = "application/json";

    public boolean handleRequest(MessageContext messageContext) {
        try {
            //We have to read the runtimegraph from the gateway internal data holder
            RuntimeGraph runtimeGraph = getRuntimeGraph();
            ExecutionStrategy queryExecutionStrategy = new AsyncExecutionStrategy();
            GraphQLOrchestrator.Builder builder = GraphQLOrchestrator.newOrchestrator();
            builder.runtimeGraph(runtimeGraph);
            builder.queryExecutionStrategy(queryExecutionStrategy);
            GraphQLOrchestrator graphQLOrchestrator = builder.build();

            //Build ExecutionInput
            ExecutionInput.Builder eiBuilder = ExecutionInput.newExecutionInput();
            String payload = messageContext.getProperty(GRAPHQL_PAYLOAD).toString();
            eiBuilder.query(payload);
            ExecutionInput executionInput = eiBuilder.build();

            //Execute GraphQL Query
            Map<String, Object> executionResult = graphQLOrchestrator.execute(executionInput).get().toSpecification();
            constructResponse(messageContext, toJson(executionResult));
        } catch (Exception e) {
            log.error("Error handling request " , e);
        }
        return false;
    }

    @Override
    public boolean handleResponse(MessageContext messageContext) {
        return true;
    }

    public void constructResponse(MessageContext messageContext, String executionResult) {

        org.apache.axis2.context.MessageContext axis2MC = ((Axis2MessageContext) messageContext).getAxis2MessageContext();

        messageContext.setResponse(true);
        messageContext.setProperty(SynapseConstants.RESPONSE, "true");
        messageContext.setTo(null);
        try {
            //Set JSON payload to the message context
            JsonUtil.getNewJsonPayload(axis2MC, executionResult ,
                    true, true);
        } catch (AxisFault e ) {
            log.error("Error while generating payload " + axis2MC.getLogIDString(), e);
        }

        //Set HTTP status code and Content type
        axis2MC.setProperty(HTTP_SC,200);
        axis2MC.setProperty(Constants.Configuration.MESSAGE_TYPE, APPLICATION_JSON_MEDIA_TYPE);
        axis2MC.setProperty(Constants.Configuration.CONTENT_TYPE, APPLICATION_JSON_MEDIA_TYPE);
        axis2MC.removeProperty(NO_ENTITY_BODY);
        Map headers = (Map) axis2MC.getProperty(org.apache.axis2.context.MessageContext.TRANSPORT_HEADERS);
        if (headers != null) {
            headers.remove(HttpHeaders.AUTHORIZATION);
            headers.remove(HttpHeaders.HOST);
        }
        //Send Response back using Axis2 Sender
        Axis2Sender.sendBack(messageContext);
    }

    private static String toJson(Object map) {
        try {
            return MAPPER.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Input map cannot be converted to json", e);
        }
    }

    private RuntimeGraph getRuntimeGraph() throws ExecutionException, InterruptedException {

        //Define GraphQL schemas for services
        String inventorySchema = "type Product @key(fields: \"upc\") @extends {\n" +
                "    upc: String! @external\n" +
                "    weight: Int @external\n" +
                "    price: Int @external\n" +
                "    inStock: Boolean\n" +
                "    shippingEstimate: Int @requires(fields: \"price weight\")\n" +
                "}";
        String productSchema = "type Query {\n" +
                "    topProducts(first: Int = 5): [Product]\n" +
                "    productB (upc : String!): Product\n" +
                "}\n" +
                "\n" +
                "type Product @key(fields: \"upc\") {\n" +
                "    upc: String!\n" +
                "    name: String\n" +
                "    price: Int\n" +
                "    weight: Int\n" +
                "}\n";
        String reviewSchema = "type Review @key(fields: \"id\") {\n" +
                "    id: ID!\n" +
                "    body: String\n" +
                "    product: Product @resolver(field:\"productB\", arguments: [{name : \"upc\", value: \"UPC001\"}])\n" +
                "}\n" +
                "\n" +
                "type User @key(fields: \"id\") @extends {\n" +
                "    id: ID! @external\n" +
                "    username: String @external\n" +
                "    reviews: [Review]\n" +
                "}\n" +
                "\n" +
                "type Product @key(fields: \"upc\") @extends {\n" +
                "    upc: String! @external\n" +
                "    reviews: [Review]\n" +
                "}\n" +
                "\n" +
                "# ================================\n" +
                "# define this as built-in directive\n" +
                "directive @resolver(field: String!, arguments: [ResolverArgument!]) on FIELD_DEFINITION\n" +
                "\n" +
                "# define this as built-in type\n" +
                "input ResolverArgument {\n" +
                "    name : String!\n" +
                "    value : String!\n" +
                "}";
        String userSchema = "type Query {\n" +
                "    me: User\n" +
                "}\n" +
                "\n" +
                "type User @key(fields: \"id\") {\n" +
                "    id: ID!\n" +
                "    name: String\n" +
                "    username: String\n" +
                "}";

        String Endpoint1 = "http://localhost:8084/graphql";
        String Endpoint2 = "http://localhost:8081/graphql";
        String Endpoint3 = "http://localhost:8083/graphql";
        String Endpoint4 = "http://localhost:8082/graphql";

        // Creating providers for your GraphQL services
        GenericProvider inventoryService = new GenericProvider(Endpoint1, httpClient, inventorySchema, "inventory");
        GenericProvider productService = new GenericProvider(Endpoint2, httpClient, productSchema, "product");
        GenericProvider reviewService = new GenericProvider(Endpoint3, httpClient, reviewSchema, "review");
        GenericProvider accountService = new GenericProvider(Endpoint4, httpClient, userSchema, "user");

        //Stitch GraphQl schemas Together
        RuntimeGraph runtimeGraph = SchemaStitcher.newBuilder()
                .service(accountService)
                .service(productService)
                .service(inventoryService)
                .service(reviewService)
                .build()
                .stitchGraph();

        return  runtimeGraph;
    }
}

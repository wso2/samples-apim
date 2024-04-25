//package org.example;
//
//import com.intuit.graphql.orchestrator.GraphQLOrchestrator;
//import com.intuit.graphql.orchestrator.schema.RuntimeGraph;
//import com.intuit.graphql.orchestrator.stitching.SchemaStitcher;
//import graphql.ExecutionInput;
//import graphql.execution.AsyncExecutionStrategy;
//import graphql.execution.ExecutionStrategy;
//import graphql.schema.idl.SchemaPrinter;
//import org.springframework.web.reactive.function.client.WebClient;
//
//import java.util.Map;
//
//import static org.springframework.web.reactive.function.client.WebClient.create;
//
//public class Test6 {
//
//
//    private static final WebClient webClient = create();
//    private ExecutionInput executionInput;
//    private static Map<String, Object> executionResult;
//
//    public static void main(String[] args) throws Exception {
//
//        ExecutionStrategy queryExecutionStrategy = new AsyncExecutionStrategy();
//        Map<String, Object> executionResult;
//
//        WebClient webClient = WebClient.create();
//
//        GenericProvider inventoryService = new GenericProvider("http://localhost:8084/graphql", webClient,
//                "src/main/resources/Inventory.graphqls", "inevntory");
//        GenericProvider productService = new GenericProvider("http://localhost:8081/graphql", webClient,
//                "src/main/resources/Product.graphqls","product");
//        GenericProvider reviewService = new GenericProvider("http://localhost:8083/graphql", webClient,
//                "src/main/resources/ReviewN.graphqls","review");
//        GenericProvider accountService  = new GenericProvider("http://localhost:8082/graphql", webClient,
//                "src/main/resources/User.graphqls","user");
//
//
//        // create a runtimeGraph by stitching service providers
//        RuntimeGraph runtimeGraph = SchemaStitcher.newBuilder()
//                .service(accountService)
//                .service(productService)
//                .service(inventoryService)
//                .service(reviewService)
//                .build()
//                .stitchGraph();
//
//        GraphQLOrchestrator.Builder builder = GraphQLOrchestrator.newOrchestrator();
//        builder.runtimeGraph(runtimeGraph);
//        builder.queryExecutionStrategy(queryExecutionStrategy);
//        GraphQLOrchestrator graphQLOrchestrator = builder.build();
//
//        String printSchema = new SchemaPrinter().print(runtimeGraph.getExecutableSchema());
//        System.out.println(printSchema);
//
//        ExecutionInput.Builder eiBuilder = ExecutionInput.newExecutionInput();
//        eiBuilder.query("{\n" +
//                "  topProducts {\n" +
//                "    name\n" +
//                "    reviews {\n" +
//                "      product {\n" +
//                "        inStock\n" +
//                "      }\n" +
//                "    }\n" +
//                "  }\n" +
//                "  me {\n" +
//                "    name\n" +
//                "  }\n" +
//                "} \n");
//
//        ExecutionInput executionInput = eiBuilder.build();
//
//        executionResult = graphQLOrchestrator.execute(executionInput).get().toSpecification();
//
//        System.out.println(executionResult);
//    }
//}
//

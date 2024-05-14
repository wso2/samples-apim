If you import the project in IntelliJ, you can run the build the jar file for this using 

`mvn clean install`

This contains the logic for the custom handler created for graphql federation that can be enagaged in the APIM 

To engage the handler,
1. First Clone the GraphQLFederation Orbit and open in IDE and run a mvn clean install to build a jar file
2. Open the GraphQLFederation-CustomHandler in IDE and run a mvn clean install to build a jar file
3. After the JAR is created include the GraphQLFederation-CustomHandler JAR file in the repository/components/dropins path of the API-M pack
4. Then navigate to repository/resources/api_templates open the velocity_template.xml file and make the changes as mentioned in velocity_template.xml mentioned in this repo
5. After making the changes start the server
6. Deploy a graphql API importing the supergraph.graphql a
7. Invoke the API and You will be able to see the output
   * if CORS error occurs please use a curl command to see the output

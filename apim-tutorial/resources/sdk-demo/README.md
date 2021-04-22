# Sample project to demonstrate API invocation using the SDK generated from Dev portal 

This sample uses the QuantisTrainAPI java sdk to invoke the QuantisTrainAPI. 

## Steps

- Download the JAVA SDK from QuantisTrainAPI and build it
- Build this project. you could use to generate an executable jar file

    mvn clean compile assembly:single 

## Run

- Subscribe to the API using an application and generate an access toke.
- invoke the API using following command. use the access token as a parameter

     java -jar target/sdk-demo-1.0.0-jar-with-dependencies.jar <access_token>
# WSO2 API Manager 4.1.0 tutorial resources

This repo contains resources that are needed to demo the API Manager 4.1.0 tutorial series.

## Prerequisite

- Java 8 or above
- Docker and Docker compose (Allocate a minimum of 4 CPU cores and 4GB Memory for Docker resources)

## Setup
   
run following command to start the environment

    docker-compose up -d

This will start WSO2 API Manager 4.1.0, WSO2 MI 4.1.0, WSO2 SI 4.1.0 and a sample REST API backend.

To view the logs 

    docker-compose logs -f

Once you are done with the demo, use 

     docker-compose down

## Demo

1. Login to the Publisher Portal (http://localhost:9443/publisher)
2. Create the API using Open API definition provided in https://github.com/chamilaadhi/apim-tutorial/blob/master/resources/openapi-train-operations.yaml . (backend url is provided in the OpenAPI definition)
3. Deploy and invoke the API.

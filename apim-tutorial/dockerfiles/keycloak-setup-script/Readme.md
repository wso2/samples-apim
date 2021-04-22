# Build
    docker build -t keycloak-script:1.0 .

# Run
    docker run -e USER=admin -e PASSWORD=admin keycloak-script:1.0

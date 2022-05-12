## Build Microservices

```sh
docker build -t <imageName> .
```

-   Train Schedule Service
    ```sh
    docker build -t <imageName> --build-arg SERVICE=train-operations .
    ```
-   Train Service
    ```sh
    docker build -t <imageName> --build-arg SERVICE=train-service .
    ```

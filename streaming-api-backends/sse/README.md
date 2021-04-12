## SSS Server

### Build From Source

Run ``mvn clean install`` from root directory

### Run Server

Navigate to target directory

Run ``java -jar sse-server-1.0.0.jar --time=5000 --interval=1000``

time - Time for which you want to serve a single request

interval - Time between successive events

Invoke URL ``curl http://localhost:8080/memory``

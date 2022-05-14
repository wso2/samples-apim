# Choreo-Connect Deployment

## 1. Microservices

1. Build microservices.
   1. [Train Schedules](../backends/train-schedule)
   2. [Train Services](../backends/train-service)
2. [Build Docker images.](../dockerfiles/backends/README.md#build-microservices)

## 2. Istio

1. Install IstioCTL
2. Istio version
   ```sh
   istioctl version

   # client version: 1.13.3
   # control plane version: 1.13.3
   # data plane version: 1.13.3 (5 proxies)
   ```

3. Install Istio
   ```sh
   istioctl install --set profile=demo -y
   ```

## 3. Choreo-Connect Deployment

![](sidecar.jpg)

1. Enable Istio injection
   ```sh
   kubectl label namespace default istio-injection=enabled
   ```

2. Deploy CC.
   ```sh
   kubectl apply -f k8s-choreo-connect/
   ```

3. Deploy Istio-Ingress gateway and Virtual Services.
   ```sh
   kubectl apply -f istio-sidecar-mode/gw_vs.yaml
   ```

## 4. Deploy Microservice in K8s cluster

1. Deploy microservice
   ```sh
   kubectl apply -f microservice/
   ```

## 5. Istio Ingress external IP

1. Get the EXTERNAL-IP of istio-ingressgateway
   ```sh
    kubectl get svc -n istio-ingressgateway
   ```
2. Add following as a host entry (in /etc/hosts of local machine)
   ```
   <EXTERNAL-IP>    internal.gw.apim.com
   ```

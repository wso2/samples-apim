#!/bin/zsh

DOMAIN=internal.gw.apim.com
SAN_IP=20.207.80.70

openssl genpkey -out server.key -algorithm RSA -pkeyopt rsa_keygen_bits:2048
openssl req -x509 -new -key server.key -out server.crt -subj "/CN=${DOMAIN}" -reqexts SAN -extensions SAN \
-config <(cat /etc/ssl/openssl.cnf <(printf "[SAN]\nsubjectAltName=DNS:${DOMAIN},IP:${SAN_IP}"))

kubectl delete -n istio-system secret ing-gateway-credential
kubectl create -n istio-system secret tls ing-gateway-credential --key=server.key --cert=server.crt

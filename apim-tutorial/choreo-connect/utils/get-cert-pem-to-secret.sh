openssl x509 -inform der -in 20.197.56.160.cer -out 20.197.56.160.pem
openssl x509 -inform der -in \*.apim.com.cer -out star.apim.com.pem
kubectl create secret generic enforcer-truststore-test --from-file 20.197.56.160.pem --from-file star.apim.com.pem
kubectl get secret enforcer-truststore-test -oyaml
kubectl delete secret enforcer-truststore-test

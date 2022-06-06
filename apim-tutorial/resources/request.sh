#!/bin/bash
token=$1
while true
do
  curl -k -X 'GET' 'https://dev.gw.apim.com/info/3.0.0/passenger-count' -H 'Authorization: Bearer '$token''
  echo ""
  echo ""
  sleep 1
done


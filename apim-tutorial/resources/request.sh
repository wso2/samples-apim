#!/bin/bash
token=$1
while true
do
  curl -k -X 'GET' 'https://20.197.56.160:8243/info/1.0.0/passenger-count' -H 'Authorization: Bearer '$token''
  echo ""
  echo ""
  sleep 1
done


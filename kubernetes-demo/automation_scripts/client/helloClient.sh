#!/bin/bash
for num in {0..5000}
do
#echo $num
curl -k -X GET "https://wso2apim-gateway/hellohello/1.0.0/" -H  "accept: application/json" -H  "Authorization: Bearer 78dbebda-2ac1-3553-a631-b40d85c79f94"
done

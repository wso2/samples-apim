#!/bin/bash

###### testing
# export APIM_HOST=localhost RETRY_SEC=10 RE_RUN=true
######

apim=$APIM_HOST
export apim
retry=$RETRY_SEC
re_run="${RE_RUN:-false}"
echo "Waiting for WSO2 API Manager to start..."

while ! nc -z $apim 9443; do   
  echo "Retrying after " $retry "s..."
  sleep $retry
done

if [ $re_run == true ]
then
   rm lock
fi
echo "WSO2 API Manager started"

## check if already created

FILE=lock
#if ! test -f "$FILE"; then
    
echo "Creating tenants"

sh tenant-creation.sh
cd quantis-resources
sh deploy-api.sh

cd ../gogo-resources
sh deploy-api.sh

cd ../railco-resources
sh deploy-api.sh

# back to home
cd ../ 
# create a file to prevent re-run
#echo "created" >> lock

fi

echo "=================================Data population completed======================================================"
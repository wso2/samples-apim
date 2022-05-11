#!/bin/bash

echo "Log in to the dev environment with tenant user"
apictl login dev

echo "Looking for APIs in : $PWD/apis"
filename='APIList.txt'
n=1
while read line; do
# reading each line
echo "API $n : $line"
apictl import api --file "$PWD/apis/$line" --environment dev --preserve-provider=false  --params "$PWD/params.yaml" -k
n=$((n+1))
done < $filename
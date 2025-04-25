This is a sample implementation of a lambda function to be used as an Authorizer for a API deployed into the AWS Gateway.

This sample lambda function,
    1. Extracts the JWT token from 'Authorization' header.
    2. Decodes and extract the 'kid' claim from the token header.
    3. Fetches the signing key from the configured JWKS endpoint.
    4. Validates the token.
    5. If the received token was valid the lambda function will return an 'allow' policy and if not a 'Deny' Policy.

This lambda function utilizes 'jsonwebtoken' and 'jwks-rsa' libraries to validate the received JWT token.

Step 1 : create the authorizer archive.

1. Update the 'jwksUri' field of the key client in `index.mjs`. This should point to the JWKS of the IDP of your choice.

2. Navigate to 'samples-apim/custom-lambda-authorizer' and execute bellow commands to install the required node modules.
    ```
        npm install jsonwebtoken
        npm install jwks-rsa
    ```
   
3. Create a .zip file that contains the contents of your project folder at the root.
    ```
        zip -r lambda-authorizer.zip .
    ```
   
For detailed instruction on creating lambda deployment packages please refer AWS official documentation at [1].

You may now create a lambda function by uploading the archive generated at step 3. 

Step 2 : Create an execution role for the lambda function

1. Navigate to IAM > roles in AWS console and create a new role below details.

    Trusted Entity Type : AWS Service
    Use Case : Lambda

2. Under Add permissions stage please add below permissions
    AWSLambdaRole
    AWSLambdaBasicExecutionRole (This is only needed if you wish to enable cloudwatch logs for the lambda function)

3. Provide a role name and edit the Trust Policy as below to allow API Gateway service as well.

    ```
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": [
                        "lambda.amazonaws.com",
                        "apigateway.amazonaws.com"
                    ]
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }
    ```

To troubleshoot issues with the lambda authorizer please configure cloud watch logs for the lambda function as instructed in [2].

[1]. https://docs.aws.amazon.com/lambda/latest/dg/nodejs-package.html
[2]. https://docs.aws.amazon.com/lambda/latest/dg/monitoring-cloudwatchlogs.html
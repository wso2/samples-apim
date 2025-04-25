import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const keyClient = jwksClient({
    cache: true,
    cacheMaxAge: 86400000,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
    strictSsl: true,
    jwksUri: "<include-your-idp-jwks-uri-here>"
})

//Update verificationOptions as required
const verificationOptions = {
    // verify claims, e.g.
    // "audience": "urn:audience"
    "algorithms": "RS256"
}

//Provided below are basic allow and deny policies that either allow or deny API resource invocation for any principalId.
//Please update the policies as suited for your requirement.
const allow = {
    "principalId": "*",
    "policyDocument": {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "execute-api:Invoke",
                "Effect": "Allow",
                "Resource": "*"
            }
        ]
    }
}

const deny = {
    "principalId": "*",
    "policyDocument": {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "execute-api:Invoke",
                "Effect": "Deny",
                "Resource": "*"
            }
        ]
    }
}

function generateIAMPolicy(resource, action) {
    const policy = {
        "principalId": "*",
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "execute-api:Invoke",
                    "Effect": action,
                    "Resource": resource
                }
            ]
        }
    }
    return policy;
}

function getSigningKey (header = decoded.header, callback) {
  //console.log("Header : " + header);
    keyClient.getSigningKey(header.kid, function(err, key) {
        const signingKey = key.publicKey || key.rsaPublicKey;
        console.log("Signing Key" + signingKey);
        callback(null, signingKey);
    })
}

//This implementation expects JWT token to be passed in the Authorization Bearer Header. Please modify as required.
function extractTokenFromHeader(e) {
    if (e.authorizationToken && e.authorizationToken.split(' ')[0] === 'Bearer') {
        return e.authorizationToken.split(' ')[1];
    } else {
        return e.authorizationToken;
    }
}
function validateToken(token, key, resource, callback) {
    jwt.verify(token, key, function (error) {
        if (error) {
            console.log("******* Validation *******: Deny");
            callback(null, generateIAMPolicy(resource, "Deny"));
        } else {
            console.log("******* Validation *******: Allow");
            callback(null, generateIAMPolicy(resource, "Allow"));
        }
    })
}
export const handler = async (event, context, callback) => {
    console.log("******* event *******: " + JSON.stringify(event));
    let token = extractTokenFromHeader(event) || '';
    var decodedJWT = jwt.decode(token, {complete: true});
    var kid = decodedJWT.header.kid;
    const key = await keyClient.getSigningKey(kid);
    console.log("******* methodARN *******: " + event.methodArn);
    validateToken(token, key.publicKey, event.methodArn, callback);
}

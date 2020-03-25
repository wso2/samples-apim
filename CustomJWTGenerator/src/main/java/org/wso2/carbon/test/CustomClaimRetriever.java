package org.wso2.carbon.test;

import org.wso2.carbon.apimgt.api.APIManagementException;
import org.wso2.carbon.apimgt.impl.token.ClaimsRetriever;

import java.util.SortedMap;
import java.util.TreeMap;
import java.util.UUID;

public class CustomClaimRetriever implements ClaimsRetriever {

    public void init() throws APIManagementException {
    //  Todo : initialize any variable for Claim retriever.
    }

    public SortedMap<String, String> getClaims(String endUserName) throws APIManagementException {

        SortedMap<String, String> claimsMap = new TreeMap();
        claimsMap.put("token-uuid", UUID.randomUUID().toString());
        if ("user1".equals(endUserName)){
            claimsMap.put("privileged", "true");
        }
        return claimsMap;
    }

    public String getDialectURI(String s) throws APIManagementException {

        return "http://wso2.org/claims";
    }
}

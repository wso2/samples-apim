/*
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

package org.wso2.caron.test;

import com.nimbusds.jwt.JWTClaimsSet;
import org.osgi.service.component.annotations.Component;
import org.wso2.carbon.apimgt.gateway.handlers.security.jwt.transformer.JWTTransformer;

import java.util.Map;

@Component(
        enabled = true,
        name = "CustomJWTTransformer",
        service = org.wso2.carbon.apimgt.gateway.handlers.security.jwt.transformer.JWTTransformer.class
)
public class CustomJWTTransformer implements JWTTransformer {

    private static final String ISSUER = "custom_issuer_name";

    @Override
    public JWTClaimsSet transform(JWTClaimsSet jwtClaimsSet) {
        /*
        *
        * Transform logic to be implement here
        */
        Map<String, Object> jwtClaimsSetMap = jwtClaimsSet.getClaims();
        JWTClaimsSet.Builder jwtBuilder = new JWTClaimsSet.Builder();
        jwtClaimsSetMap.put("customClaim1key", "CustomClaim1Value");
        jwtClaimsSetMap.put("customClaim2key", "CustomClaim2Value");
        for (String key : jwtClaimsSetMap.keySet()) {
            jwtBuilder.claim(key, jwtClaimsSetMap.get(key));
        }
        return jwtBuilder.build();
    }

    @Override
    public String getIssuer() {
        return ISSUER;
    }
}

package org.wso2.carbon.test;

import org.osgi.service.component.annotations.Component;
import org.wso2.carbon.apimgt.gateway.dto.JWTInfoDto;
import org.wso2.carbon.apimgt.gateway.handlers.security.jwt.generator.APIMgtGatewayJWTGeneratorImpl;
import org.wso2.carbon.apimgt.gateway.handlers.security.jwt.generator.AbstractAPIMgtGatewayJWTGenerator;

import java.util.Map;
import java.util.UUID;

@Component(
        enabled = true,
        service = AbstractAPIMgtGatewayJWTGenerator.class,
        name = "customgatewayJWTGenerator"
)
public class CustomGatewayJWTGenerator extends APIMgtGatewayJWTGeneratorImpl {

    @Override
    public Map<String, Object> populateStandardClaims(JWTInfoDto jwtInfoDto) {

        return super.populateStandardClaims(jwtInfoDto);
    }

    @Override
    public Map<String, Object> populateCustomClaims(JWTInfoDto jwtInfoDto) {

        Map<String, Object> claims = super.populateCustomClaims(jwtInfoDto);
        claims.put("uuid", UUID.randomUUID().toString());
        return claims;
    }
}

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

package org.wso2.caron.test.internal;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.caron.test.ExtendedJWTTransformer;
import org.osgi.framework.BundleContext;
import org.osgi.service.component.ComponentContext;
import org.osgi.service.component.annotations.*;
import org.wso2.carbon.apimgt.gateway.handlers.security.jwt.transformer.JWTTransformer;
import org.wso2.carbon.apimgt.impl.APIManagerConfiguration;
import org.wso2.carbon.apimgt.impl.APIManagerConfigurationService;
import org.wso2.carbon.apimgt.impl.dto.JWTConfigurationDto;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

@Component(
        name = "org.example.handlers",
        immediate = true)
public class ActivatorComponent {
    private static final Log log = LogFactory.getLog(ActivatorComponent.class);
    private APIManagerConfiguration configuration;

    @Activate
    protected void activate(ComponentContext context) {
        BundleContext bundleContext = context.getBundleContext();
        if (log.isDebugEnabled()) {
            log.debug("API handlers component activated");
        }
        Properties defaultClaimMappings = new Properties();
        InputStream resourceAsStream =
                this.getClass().getClassLoader().getResourceAsStream("default-claim-mapping.properties");
        try {
            defaultClaimMappings.load(resourceAsStream);
        } catch (IOException e) {
            log.error("Unable to read/find the default-claim-mapping.properties ", e);
        }

        JWTConfigurationDto jwtConfigurationDto = ServiceReferenceHolder.getInstance()
                .getApiManagerConfigurationService().getAPIManagerConfiguration().getJwtConfigurationDto();
        ExtendedJWTTransformer extendedJWTTransformer = new
                ExtendedJWTTransformer(jwtConfigurationDto, defaultClaimMappings);
        bundleContext.registerService(JWTTransformer.class.getName(), extendedJWTTransformer, null);
    }

    @Deactivate
    protected void deactivate(ComponentContext context) {
        if (log.isDebugEnabled()) {
            log.debug("component deactivated");
        }
    }

    @Reference(
            name = "api.manager.config.service",
            service = org.wso2.carbon.apimgt.impl.APIManagerConfigurationService.class,
            cardinality = ReferenceCardinality.MANDATORY,
            policy = ReferencePolicy.DYNAMIC,
            unbind = "unsetAPIManagerConfigurationService")
    protected void setAPIManagerConfigurationService(APIManagerConfigurationService amcService) {
        if (log.isDebugEnabled()) {
            log.debug("API manager configuration service bound to the API handlers");
        }
        ServiceReferenceHolder.getInstance().setAPIManagerConfigurationService(amcService);
    }

    protected void unsetAPIManagerConfigurationService(APIManagerConfigurationService amcService) {
        if (log.isDebugEnabled()) {
            log.debug("API manager configuration service unbound from the API handlers");
        }
        ServiceReferenceHolder.getInstance().setAPIManagerConfigurationService(null);
    }
}

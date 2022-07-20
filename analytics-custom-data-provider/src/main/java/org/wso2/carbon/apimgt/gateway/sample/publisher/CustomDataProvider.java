/*
 *  Copyright (c) 2022, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

package org.wso2.carbon.apimgt.gateway.sample.publisher;

import io.netty.channel.ChannelHandlerContext;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.synapse.MessageContext;
import org.wso2.carbon.apimgt.common.analytics.collectors.AnalyticsCustomDataProvider;
import org.wso2.carbon.apimgt.gateway.handlers.security.AuthenticationContext;
import org.wso2.carbon.apimgt.gateway.handlers.streaming.websocket.WebSocketUtils;

import java.util.HashMap;
import java.util.Map;

public class CustomDataProvider implements AnalyticsCustomDataProvider {

    private static final Log log = LogFactory.getLog(CustomDataProvider.class);
    private static final String SYNAPSE_TOKEN_ISSUER = "issuer";
    private static final String ASYNC_AUTH_CONTEXT = "__API_AUTH_CONTEXT";

    public CustomDataProvider() {
        log.info("Successfully initialized");
    }

    @Override public Map<String, Object> getCustomProperties(Object context) {
        if (context instanceof MessageContext) {
            Map<String, Object> customProperties = new HashMap<>();
            customProperties.put("tokenIssuer", getSynapseTokenIssuer((MessageContext) context));
            return customProperties;
        }
        if (context instanceof ChannelHandlerContext) {
            Map<String, Object> customProperties = new HashMap<>();
            customProperties.put("tokenIssuer", getAsyncTokenIssuer((ChannelHandlerContext) context));
            return customProperties;
        }
        return null;
    }

    private String getSynapseTokenIssuer(MessageContext context) {

        if (context.getPropertyKeySet().contains(SYNAPSE_TOKEN_ISSUER)) {
            return (String) context.getProperty(SYNAPSE_TOKEN_ISSUER);
        }
        return null;
    }

    private String getAsyncTokenIssuer(ChannelHandlerContext context) {

        Object authContext = WebSocketUtils.getPropertyFromChannel(ASYNC_AUTH_CONTEXT, context);
        if (authContext != null && authContext instanceof AuthenticationContext) {
            return ((AuthenticationContext)authContext).getIssuer();
        }
        return null;
    }

}

/*
 *  Copyright (c) 2023, WSO2 LLC. (http://www.wso2.org) All Rights Reserved.
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

package org.wso2.am.thrift.analytics.data.provider;

import io.netty.channel.ChannelHandlerContext;
import io.netty.util.AttributeKey;
import org.apache.axiom.soap.SOAPBody;
import org.apache.axiom.soap.SOAPEnvelope;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.http.HttpHeaders;
import org.apache.synapse.MessageContext;
import org.apache.synapse.SynapseConstants;
import org.apache.synapse.core.axis2.Axis2MessageContext;
import org.apache.synapse.rest.RESTConstants;
import org.apache.synapse.transport.passthru.util.RelayUtils;
import org.wso2.carbon.apimgt.common.analytics.collectors.AnalyticsCustomDataProvider;
import org.wso2.carbon.apimgt.gateway.APIMgtGatewayConstants;
import org.wso2.carbon.apimgt.gateway.handlers.analytics.Constants;
import org.wso2.carbon.apimgt.gateway.handlers.security.APISecurityUtils;
import org.wso2.carbon.apimgt.gateway.handlers.security.AuthenticationContext;
import org.wso2.carbon.apimgt.gateway.handlers.streaming.websocket.WebSocketUtils;
import org.wso2.carbon.apimgt.gateway.utils.GatewayUtils;
import org.wso2.carbon.apimgt.impl.APIConstants;
import org.wso2.carbon.apimgt.impl.APIManagerAnalyticsConfiguration;
import org.wso2.carbon.utils.multitenancy.MultitenantUtils;

import javax.xml.stream.XMLStreamException;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.charset.Charset;
import java.util.HashMap;
import java.util.Map;

public class ThriftAnalyticsDataProvider implements AnalyticsCustomDataProvider {

    private static final Log log = LogFactory.getLog(ThriftAnalyticsDataProvider.class);
    private static final String COLLECT_RESPONSE_MESSAGE_SIZE_CONFIG_PROPERTY =
            "thrift.data.provider.collect.response.message.size";
    private static final String SYNAPSE_GW_LABEL = "Synapse";
    private static final String OTHER_LATENCY_MESSAGE_CONTEXT_PROPERTY = "other_latency";
    private static final String SERVICE_PREFIX_AXIS2_MESSAGE_CONTEXT_PROPERTY = "SERVICE_PREFIX";
    private static final AttributeKey<Map<String, Object>> API_PROPERTIES_ATTRIBUTE_KEY =
            AttributeKey.valueOf("API_PROPERTIES");
    private static final String API_AUTH_CONTEXT_WEBSOCKET_WSO2_PROPERTY = "__API_AUTH_CONTEXT";
    private static final String API_RESOURCE_PATH_WEBSOCKET_WSO2_PROPERTY = "API_ELECTED_RESOURCE";
    private static final String API_HOSTNAME_WEBSOCKET_API_PROPERTY = "api.ut.hostName";
    private static final String APIM_ANALYTICS_REQUEST_START_TIME = "apim.analytics.request.start.time";
    private static final String WEBSOCKET_PROTOCOL = "WebSocket";

    private boolean shouldBuildMessage = false;

    public ThriftAnalyticsDataProvider() {
        APIManagerAnalyticsConfiguration config = APIManagerAnalyticsConfiguration.getInstance();
        if (config != null) {
            String collectResponseMessageSize = config.getReporterProperties()
                    .get(COLLECT_RESPONSE_MESSAGE_SIZE_CONFIG_PROPERTY);
            if (collectResponseMessageSize != null) {
                shouldBuildMessage = Boolean.parseBoolean(collectResponseMessageSize);
            }
        }
        log.info("Successfully initialized ThriftAnalyticsDataProvider");
    }

    @Override
    public Map<String, Object> getCustomProperties(Object context) {
        Map<String, Object> customProperties = new HashMap<>();
        try {
            if (context instanceof MessageContext) {
                MessageContext messageContext = (MessageContext) context;
                AuthenticationContext authContext = APISecurityUtils.getAuthenticationContext((MessageContext) context);

                customProperties.put(PropertyKeys.APPLICATION_CONSUMER_KEY, getApplicationConsumerKey(authContext)); // TODO: uncomment this
                customProperties.put(PropertyKeys.API_RESOURCE_PATH, getApiResourcePath(messageContext));
                customProperties.put(PropertyKeys.API_TIER, getTier(authContext));
                String hostName = getApiHostName(messageContext);
                customProperties.put(PropertyKeys.API_HOSTNAME, hostName); // Used by the response stream
                customProperties.put(PropertyKeys.HOSTNAME, hostName); // Used by fault & throttle streams
                customProperties.put(PropertyKeys.USER_TENANT_DOMAIN, getUserTenantDomain(authContext));
                customProperties.put(PropertyKeys.THROTTLED_OUT, getThrottledOut(messageContext));
                customProperties.put(PropertyKeys.RESPONSE_TIME, getResponseTime(messageContext));
                customProperties.put(PropertyKeys.SERVICE_TIME, getServiceTime(messageContext));
                customProperties.put(PropertyKeys.BACKEND_TIME, getBackendTime(messageContext));
                customProperties.put(PropertyKeys.RESPONSE_SIZE, getResponseSize(messageContext));
                customProperties.put(PropertyKeys.PROTOCOL, getProtocol(messageContext));
                customProperties.put(PropertyKeys.SECURITY_LATENCY, getSecurityLatency(messageContext));
                customProperties.put(PropertyKeys.THROTTLING_LATENCY, getThrottlingLatency(messageContext));
                customProperties.put(PropertyKeys.OTHER_LATENCY, getOtherLatency(messageContext));
                customProperties.put(PropertyKeys.LABEL, SYNAPSE_GW_LABEL);

                // Attributes specific to the fault stream
                customProperties.put(PropertyKeys.ERROR_CODE, getErrorCode(messageContext));
                customProperties.put(PropertyKeys.ERROR_MESSAGE, getErrorMessage(messageContext));

                // Attributes specific to the throttle stream
                customProperties.put(PropertyKeys.SUBSCRIBER, getSubscriber(authContext));
                customProperties.put(PropertyKeys.THROTTLED_OUT_REASON, getThrottledOutReason(messageContext));
                customProperties.put(PropertyKeys.THROTTLED_OUT_TIMESTAMP, getThrottledOutTimestamp(messageContext));
            } else if (context instanceof ChannelHandlerContext) {
                // For WebSocket APIs

                Map<String, Object> wso2Properties = WebSocketUtils.getApiProperties((ChannelHandlerContext) context);
                Map<String, Object> apiProperties = getApiProperties((ChannelHandlerContext) context);
                AuthenticationContext authenticationContext =
                        (AuthenticationContext) wso2Properties.get(API_AUTH_CONTEXT_WEBSOCKET_WSO2_PROPERTY);

                customProperties.put(PropertyKeys.APPLICATION_CONSUMER_KEY,
                        getApplicationConsumerKey(authenticationContext));
                customProperties.put(PropertyKeys.API_RESOURCE_PATH,
                        wso2Properties.get(API_RESOURCE_PATH_WEBSOCKET_WSO2_PROPERTY));
                customProperties.put(PropertyKeys.API_TIER, getTier(authenticationContext));
                customProperties.put(PropertyKeys.API_HOSTNAME, apiProperties.get(API_HOSTNAME_WEBSOCKET_API_PROPERTY));
                customProperties.put(PropertyKeys.HOSTNAME, apiProperties.get(API_HOSTNAME_WEBSOCKET_API_PROPERTY));
                customProperties.put(PropertyKeys.USER_TENANT_DOMAIN, getUserTenantDomain(authenticationContext));
                customProperties.put(PropertyKeys.THROTTLED_OUT, true);
                customProperties.put(PropertyKeys.RESPONSE_TIME, 0L);
                customProperties.put(PropertyKeys.SERVICE_TIME, 0L);
                customProperties.put(PropertyKeys.BACKEND_TIME, 0L);
                customProperties.put(PropertyKeys.RESPONSE_SIZE, 0L);
                customProperties.put(PropertyKeys.PROTOCOL, WEBSOCKET_PROTOCOL);
                customProperties.put(PropertyKeys.SECURITY_LATENCY, 0L);
                customProperties.put(PropertyKeys.THROTTLING_LATENCY, 0L);
                customProperties.put(PropertyKeys.OTHER_LATENCY, 0L);
                customProperties.put(PropertyKeys.LABEL, SYNAPSE_GW_LABEL);

                // Attributes specific to the fault stream
                customProperties.put(PropertyKeys.ERROR_CODE, getWebSocketErrorCode(wso2Properties));
                customProperties.put(PropertyKeys.ERROR_MESSAGE, getWebsocketErrorMessage(wso2Properties));

                // Attributes specific to the throttle stream
                customProperties.put(PropertyKeys.SUBSCRIBER, getSubscriber(authenticationContext));
                customProperties.put(PropertyKeys.THROTTLED_OUT_REASON, getWebsocketErrorMessage(wso2Properties));
                customProperties.put(PropertyKeys.THROTTLED_OUT_TIMESTAMP,
                        getWebSocketThrottledOutTimestamp(wso2Properties));
            }
        } catch (Exception e) {
            log.error("Cannot build custom properties, hence returning an empty map for custom properties.", e);
        }
        return customProperties;
    }

    private String getApplicationConsumerKey(AuthenticationContext authenticationContext) {
        if (authenticationContext != null) {
            return authenticationContext.getConsumerKey();
        }
        return null;
    }

    private String getApiResourcePath(MessageContext messageContext) {
        return GatewayUtils.extractResource(messageContext);
    }

    private String getTier(AuthenticationContext authenticationContext) {
        if (authenticationContext != null) {
            return authenticationContext.getTier();
        }
        return null;
    }

    private String getApiHostName(MessageContext messageContext) {
        return GatewayUtils.getHostName(messageContext);
    }

    private String getUserTenantDomain(AuthenticationContext authenticationContext) {
        if (authenticationContext != null) {
            return MultitenantUtils.getTenantDomain(authenticationContext.getUsername());
        }
        return null;
    }

    private boolean getThrottledOut(MessageContext messageContext) {
        Object throttleOutProperty = messageContext.getProperty(APIConstants.API_USAGE_THROTTLE_OUT_PROPERTY_KEY);
        return (throttleOutProperty instanceof Boolean) ? (Boolean) throttleOutProperty : false;
    }

    private long getResponseTime(MessageContext messageContext) {
        Object requestStartTime = messageContext.getProperty(Constants.REQUEST_START_TIME_PROPERTY);
        if (requestStartTime != null) {
            return System.currentTimeMillis() - (long) requestStartTime;
        }
        return 0;
    }

    private long getServiceTime(MessageContext messageContext) {
        long responseTime = getResponseTime(messageContext);
        long backendTime = getBackendTime(messageContext);
        if (responseTime != -1 && backendTime != -1) {
            return responseTime - backendTime;
        }
        return 0;
    }

    private long getBackendTime(MessageContext messageContext) {
        Object backendEndTime = messageContext.getProperty(Constants.BACKEND_END_TIME_PROPERTY);
        Object backendStartTime = messageContext.getProperty(Constants.BACKEND_START_TIME_PROPERTY);
        if (backendEndTime != null && backendStartTime != null) {
            return (long) backendEndTime - (long) backendStartTime;
        }
        return 0;
    }

    private long getResponseSize(MessageContext messageContext) {
        long responseSize = 0;
        if (shouldBuildMessage) {
            org.apache.axis2.context.MessageContext axis2MessageContext = ((Axis2MessageContext) messageContext).
                    getAxis2MessageContext();
            Map headers = (Map) axis2MessageContext.getProperty(
                    org.apache.axis2.context.MessageContext.TRANSPORT_HEADERS);
            String contentLength = (String) headers.get(HttpHeaders.CONTENT_LENGTH);
            if (contentLength != null) {
                responseSize = Integer.parseInt(contentLength);
            } else {  //When chunking is enabled
                try {
                    RelayUtils.buildMessage(axis2MessageContext);
                } catch (IOException ex) {
                    //In case of an exception, it won't be propagated up,and set response size to 0
                    log.error("Error occurred while building the message to" +
                            " calculate the response body size", ex);
                } catch (XMLStreamException ex) {
                    log.error("Error occurred while building the message to calculate the response" +
                            " body size", ex);
                }

                SOAPEnvelope env = messageContext.getEnvelope();
                if (env != null) {
                    SOAPBody soapbody = env.getBody();
                    if (soapbody != null) {
                        byte[] size = soapbody.toString().getBytes(Charset.defaultCharset());
                        responseSize = size.length;
                    }
                }
            }
        }
        return responseSize;
    }

    private String getProtocol(MessageContext messageContext) throws MalformedURLException {
        String url = (String) messageContext.getProperty(RESTConstants.REST_URL_PREFIX);
        if (url == null) {
            org.apache.axis2.context.MessageContext axis2MC = ((Axis2MessageContext) messageContext).
                    getAxis2MessageContext();
            url = (String) axis2MC.getProperty(SERVICE_PREFIX_AXIS2_MESSAGE_CONTEXT_PROPERTY);
        }
        URL apiUrl = new URL(url);
        int port = apiUrl.getPort();
        return messageContext.getProperty(SynapseConstants.TRANSPORT_IN_NAME) + "-" + port;
    }

    private long getSecurityLatency(MessageContext messageContext) {
        Object securityLatency = messageContext.getProperty(APIMgtGatewayConstants.SECURITY_LATENCY);
        return securityLatency == null ? 0 : ((Number) securityLatency).longValue();
    }

    private long getThrottlingLatency(MessageContext messageContext) {
        Object throttlingLatency = messageContext.getProperty(APIMgtGatewayConstants.THROTTLING_LATENCY);
        return throttlingLatency == null ? 0 : ((Number) throttlingLatency).longValue();
    }

    private long getOtherLatency(MessageContext messageContext) {
        Object otherLatency = messageContext.getProperty(OTHER_LATENCY_MESSAGE_CONTEXT_PROPERTY);
        return otherLatency == null ? 0 : ((Number) otherLatency).longValue();
    }

    private String getErrorCode(MessageContext messageContext) {
        Object errorCode = messageContext.getProperty(SynapseConstants.ERROR_CODE);
        return errorCode != null ? String.valueOf(errorCode) : null;
    }

    private String getWebSocketErrorCode(Map<String, Object> wso2Properties) {
        Object errorCode = wso2Properties.get(SynapseConstants.ERROR_CODE);
        return errorCode != null ? String.valueOf(errorCode) : null;
    }

    private String getErrorMessage(MessageContext messageContext) {
        Object errorMessage = messageContext.getProperty(SynapseConstants.ERROR_MESSAGE);
        return errorMessage != null ? (String) errorMessage : null;
    }

    private String getWebsocketErrorMessage(Map<String, Object> wso2Properties) {
        Object errorMessage = wso2Properties.get(SynapseConstants.ERROR_MESSAGE);
        return errorMessage != null ? (String) errorMessage : null;
    }

    private String getSubscriber(AuthenticationContext authenticationContext) {
        if (authenticationContext != null) {
            return authenticationContext.getSubscriber();
        }
        return null;
    }

    private String getThrottledOutReason(MessageContext messageContext) {
        Object throttleOutReason = messageContext.getProperty(APIConstants.THROTTLE_OUT_REASON_KEY);
        if (throttleOutReason != null) {
            return (String) throttleOutReason;
        }
        return APIConstants.THROTTLE_OUT_REASON_SOFT_LIMIT_EXCEEDED;
    }

    private long getThrottledOutTimestamp(MessageContext messageContext) {
        Object requestStartTime = messageContext.getProperty(Constants.REQUEST_START_TIME_PROPERTY);
        return (requestStartTime instanceof Long) ? (long) requestStartTime : 0;
    }

    private long getWebSocketThrottledOutTimestamp(Map<String, Object> wso2Properties) {
        Object requestStartTime = wso2Properties.get(APIM_ANALYTICS_REQUEST_START_TIME);
        return (requestStartTime instanceof Long) ? (long) requestStartTime : 0;
    }

    public static Map<String, Object> getApiProperties(ChannelHandlerContext ctx) {
        Object prop = ctx.channel().attr(API_PROPERTIES_ATTRIBUTE_KEY).get();
        if (prop != null) {
            return (Map<String, Object>) prop;
        }
        return new HashMap<>();
    }

    private static class PropertyKeys {
        static final String APPLICATION_CONSUMER_KEY = "applicationConsumerKey";
        static final String API_RESOURCE_PATH = "apiResourcePath";
        static final String API_TIER = "apiTier";
        static final String API_HOSTNAME = "apiHostname";
        static final String HOSTNAME = "hostname";
        static final String USER_TENANT_DOMAIN = "userTenantDomain";
        static final String THROTTLED_OUT = "throttledOut";
        static final String RESPONSE_TIME = "responseTime";
        static final String SERVICE_TIME = "serviceTime";
        static final String BACKEND_TIME = "backendTime";
        static final String RESPONSE_SIZE = "responseSize";
        static final String PROTOCOL = "protocol";
        static final String SECURITY_LATENCY = "securityLatency";
        static final String THROTTLING_LATENCY = "throttlingLatency";
        static final String OTHER_LATENCY = "otherLatency";
        static final String LABEL = "label";
        static final String ERROR_CODE = "errorCode";
        static final String ERROR_MESSAGE = "errorMessage";
        static final String SUBSCRIBER = "subscriber";
        static final String THROTTLED_OUT_REASON = "throttledOutReason";
        static final String THROTTLED_OUT_TIMESTAMP = "throttledOutTimestamp";
    }

}

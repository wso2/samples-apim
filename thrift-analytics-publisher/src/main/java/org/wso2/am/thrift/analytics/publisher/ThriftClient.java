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

package org.wso2.am.thrift.analytics.publisher;

import com.google.gson.Gson;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wso2.am.analytics.publisher.exception.MetricReportingException;
import org.wso2.carbon.databridge.agent.DataPublisher;
import org.wso2.carbon.databridge.agent.exception.DataEndpointAgentConfigurationException;
import org.wso2.carbon.databridge.agent.exception.DataEndpointAuthenticationException;
import org.wso2.carbon.databridge.agent.exception.DataEndpointConfigurationException;
import org.wso2.carbon.databridge.agent.exception.DataEndpointException;
import org.wso2.carbon.databridge.commons.Event;
import org.wso2.carbon.databridge.commons.exception.TransportException;
import org.wso2.carbon.databridge.commons.utils.DataBridgeCommonsUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Publishes analytics events to a Thrift server.
 */
public class ThriftClient {

    private static final Logger log = LoggerFactory.getLogger(ThriftClient.class);
    private static final String APIM_4XX_STREAM_VERSION = "4.2.0";
    private final Gson gson;
    private DataPublisher dataPublisher;

    public ThriftClient(String type, String serverURL, String authURL, String serverUser,
                        String serverPassword) {
        try {
            dataPublisher = createDataPublisher(type, serverURL, authURL, serverUser, serverPassword);
        } catch (DataEndpointConfigurationException e) {
            log.error("Error while creating the data publisher with configurations", e);
        } catch (DataEndpointException | DataEndpointAgentConfigurationException | TransportException |
                DataEndpointAuthenticationException e) {
            log.error("Error while creating the data publisher", e);
        }
        gson = new Gson();
    }

    private DataPublisher createDataPublisher(String type, String serverURL, String authURL, String serverUser,
                                              String serverPassword)
            throws DataEndpointAuthenticationException, DataEndpointAgentConfigurationException, TransportException,
            DataEndpointException, DataEndpointConfigurationException {
        return new DataPublisher(type, serverURL, authURL, serverUser, serverPassword);
    }

    public void publish(ThriftMetricEventBuilder builder) throws MetricReportingException {
        Map<String, Object> eventMap = builder.build();
        ThriftStream thriftStream = builder.getThriftStream();
        String streamName = thriftStream.getStreamName();

        Object[] payload = generatePayload(thriftStream, eventMap);

        Event event = new Event();
        String streamId = DataBridgeCommonsUtils.generateStreamId(streamName, APIM_4XX_STREAM_VERSION);
        event.setStreamId(streamId);
        event.setMetaData(null);
        event.setCorrelationData(null);
        event.setPayloadData(payload);

        try {
            if (log.isDebugEnabled()) {
                String eventMapPayload = gson.toJson(eventMap);
                log.debug("eventMap payload: " + eventMapPayload);
            }
            boolean isPublished = dataPublisher.tryPublish(event);
            if (!isPublished) {
                log.error("Unable to publish data to stream: {} since the queue is full", streamId);
            }
        } catch (Exception e) {
            log.error("Error occurred while publishing data to stream: {}", streamId, e);
        }
    }

    private Object[] generatePayload(ThriftStream thriftStream, Map<String, Object> eventMap) {
        Map<String, Class> eventAttributes;
        if (thriftStream == ThriftStream.FAULT_STREAM) {
            eventAttributes = InputValidator.getInstance().getEventProperties(ThriftMetricSchema.THRIFT_ERROR);
        } else if (thriftStream == ThriftStream.THROTTLE_STREAM) {
            eventAttributes = InputValidator.getInstance().getEventProperties(ThriftMetricSchema.THRIFT_THROTTLE_OUT);
        } else {
            eventAttributes = InputValidator.getInstance().getEventProperties(ThriftMetricSchema.THRIFT_RESPONSE);
        }

        List<Object> payload = new ArrayList<>();
        for (Map.Entry<String, Class> attributeEntry : eventAttributes.entrySet()) {
            String attributeKey = attributeEntry.getKey();
            Object attributeValue;
            if (Constants.PROPERTIES.equals(attributeKey) || Constants.META_CLIENT_TYPE.equals(attributeKey)) {
                attributeValue = gson.toJson(eventMap.get(attributeKey));
            } else {
                attributeValue = eventMap.get(attributeKey);
            }
            payload.add(attributeValue);
        }
        return payload.toArray();
    }
}

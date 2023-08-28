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

/**
 * Represents Thrift streams to which, analytics events are published to.
 */
public enum ThriftStream {
    REQUEST_STREAM("org.wso2.apimgt.statistics.request"),
    FAULT_STREAM("org.wso2.apimgt.statistics.fault"),
    THROTTLE_STREAM("org.wso2.apimgt.statistics.throttle");

    private final String streamName;

    ThriftStream(String streamName) {
        this.streamName = streamName;
    }

    public String getStreamName() {
        return streamName;
    }
}

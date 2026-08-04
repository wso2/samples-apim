# Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.

# This software is the property of WSO2 Inc. and its suppliers, if any.
# Dissemination of any information or reproduction of any material contained
# herein is strictly forbidden, unless permitted by WSO2 in accordance with
# the WSO2 Commercial License available at http://wso2.com/licenses.
# For specific language governing the permissions and limitations under
# this license, please see the license as well as any agreement you’ve
# entered into with WSO2 governing the purchase of this software and any


FROM ghcr.io/graalvm/native-image:ol8-java17-22.3.3 as build
WORKDIR /app/build
COPY target/bin/testgpt.jar .
RUN native-image -jar testgpt.jar --no-fallback -H:+StaticExecutableWithDynamicLibC

FROM gcr.io/distroless/base
WORKDIR /home/ballerina
COPY --from=build /app/build/testgpt .
CMD ["./testgpt"]

# ---------------------------------------------------------------------------
#  Copyright (c) 2021, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
#
#  WSO2 Inc. licenses this file to you under the Apache License,
#  Version 2.0 (the "License"); you may not use this file except
#  in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing,
#  software distributed under the License is distributed on an
#  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied. See the License for the
#  specific language governing permissions and limitations
#  under the License.
# ---------------------------------------------------------------------------

# set base Docker image to AdoptOpenJDK Alpine Docker image
FROM adoptopenjdk/openjdk11:jdk-11.0.9_11-alpine
LABEL maintainer="WSO2 Docker Maintainers <dev@wso2.org>"

# docker image build arguments for user/group configurations
ARG USER=wso2carbon
ARG USER_ID=802
ARG USER_GROUP=wso2
ARG USER_GROUP_ID=802
ARG USER_HOME=/home/${USER}
# docker image build arguments for wso2 product installation
ARG STREAMING_INTEGRATOR_NAME=wso2si
ARG STREAMING_INTEGRATOR_HOME=${USER_HOME}/${STREAMING_INTEGRATOR_NAME}

# build arguments for WSO2 product installation
ARG WSO2_SERVER_NAME=wso2si
ARG WSO2_SERVER_VERSION=4.0.0-alpha
ARG WSO2_SERVER=${WSO2_SERVER_NAME}-${WSO2_SERVER_VERSION}
ARG WSO2_SERVER_HOME=${USER_HOME}/${WSO2_SERVER}

# create the user and group
RUN \
    addgroup --system -g ${USER_GROUP_ID} ${USER_GROUP} \
    && adduser --system --home ${USER_HOME} -g ${USER_GROUP_ID} -u ${USER_ID} ${USER}

COPY --chown=wso2carbon:wso2 docker-entrypoint.sh ${USER_HOME}/
COPY --chown=wso2carbon:wso2 ${WSO2_SERVER}.zip /
# install required packages
RUN \
    apk add --no-cache \
        bash \
        libxml2-utils \
        netcat-openbsd
# add the WSO2 product distribution to user's home directory
RUN \
    unzip -d ${USER_HOME} ${WSO2_SERVER}.zip \
    && rm -f ${WSO2_SERVER}.zip \
    && chown wso2carbon:wso2 -R ${WSO2_SERVER_HOME}

# set the user and work directory
USER ${USER}
WORKDIR ${USER_HOME}

# set environment variables
ENV WORKING_DIRECTORY=${USER_HOME} \
    WSO2_SERVER_HOME=${WSO2_SERVER_HOME}

# expose streaming-integrator ports
EXPOSE 7443 7070 9090 9443 7711 7611

# initiate container and execute the Streaming Integrator product startup script
ENTRYPOINT ["/home/wso2carbon/docker-entrypoint.sh"]
RUN ["chmod", "+x", "/home/wso2carbon/docker-entrypoint.sh"]

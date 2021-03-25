# ------------------------------------------------------------------------
#
# Copyright 2021 WSO2, Inc. (http://wso2.com)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License
#
# ------------------------------------------------------------------------

FROM jenkins/jenkins:2.277.1
ENV JAVA_OPTS -Djenkins.install.runSetupWizard=false -Dhudson.model.ParametersAction.keepUndefinedParameters=true
ENV CASC_JENKINS_CONFIG /var/jenkins_home/casc.yaml
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN /usr/local/bin/install-plugins.sh < /usr/share/jenkins/ref/plugins.txt
COPY jenkins_casc.yaml /var/jenkins_home/casc.yaml
USER 0
RUN wget https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
RUN chmod +x ./kubectl
RUN mv ./kubectl /usr/local/bin

# You need to fill in the following empty to setup the sever.

# Configurations related to Jenkins instance
ENV JENKINS_ADMIN_ID=admin \
    JENKINS_ADMIN_PASSWORD=admin \
    JENKINS_URL=http://localhost:8080/ \
    JENKINS_ADMIN_EMAIL_ADDRESS=admin@sample.org \
    SMTP_HOST= \
    SMTP_PORT= \
    SMTP_USERNAME= \
    SMTP_APP_PASSWORD= \
    EMAIL_NOTIFICATION_RECEIVERS= \
    SYNAPSE_TEST_FRAMEOWRK_CONFIGS='-DtestServerType=remote -DtestServerHost= -DtestServerPort='
    
# Configurations related to source and deployment project in Github  
ENV GIT_SCM_CONFIG_USERNAME= \
    GIT_SCM_CONFIG_EMAIL= \
    GIT_SCM_CONFIG_PASSWORD_TOKEN= \
    GIT_SCM_PROJECT_ID=integration-project \
    PROJECT_NAME=sample-integration-project \
    SOURCE_GIT_RESPOSITORY= \
    DEPLOYMENT_GIT_REPOSITORY= \
    DEPLOYMENT_DEV_BRANCH=dev \
    DEPLOYMENT_STAGING_BRANCH=staging \
    DEPLOYMENT_PROD_BRANCH=prod

# Configurations related to Docker and Kubernetes 
ENV DOCKER_REGISTRY_USERNAME= \
    DOCKER_REGISTRY_PASSWORD= \
    DEV_NAMESPACE=mi-dev \
    STAGING_NAMESPACE=mi-staging \
    PROD_NAMESPACE=mi-prod

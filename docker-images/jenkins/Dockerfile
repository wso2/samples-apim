FROM jenkins/jenkins:2.249.3
ENV JAVA_OPTS -Djenkins.install.runSetupWizard=false -Dhudson.model.ParametersAction.keepUndefinedParameters=true
ENV CASC_JENKINS_CONFIG /var/jenkins_home/casc.yaml
COPY ../../conf/plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN /usr/local/bin/install-plugins.sh < /usr/share/jenkins/ref/plugins.txt
COPY ../../scripts/jenkins_casc.yaml /var/jenkins_home/casc.yaml
ENV JENKINS_ADMIN_ID=admin \
    JENKINS_ADMIN_PASSWORD=admin \
    JENKINS_URL=http://localhost:8080/ \
    GIT_SCM_CONFIG_USERNAME=username \
    GIT_SCM_CONFIG_EMAIL=email \
    GIT_SCM_CONFIG_PASSWORD_TOKEN=token \
    GIT_SCM_PROJECT_ID=my-scm-server \
    SMTP_USERNAME=email \
    SMTP_APP_PASSWORD=password \
    NEXUS_VERSION=nexus3 \
    NEXUS_PROTOCOL=HTTP \
    NEXUS_URL=192.168.1.3:8081 \
    NEXUS_USERNAME=adminuser \
    NEXUS_PASSWORD=admin123 \
    PROJECT_NAME=my-project \
    PROJECT_GIT_URL=https://github.com/sajithaliyanage/MI_CICD.git \
    SYNAPSE_TEST_FRAMEOWRK_CONFIGS=-Dmaven.test.skip=true \
    PROJECT_GROUPID=wso2.sampleHelloWorld \
    PROJECT_GROUPID_PATH=wso2/sampleHelloWorld \
    PROJECT_CAPP_ARTIFACTID=helloCompositeExporter \
    DEV_ENVIRONMENT_IP=192.168.1.3:9164 \
    DEV_ENVIRONMENT_BASIC_AUTH_TOKEN=YWRtaW46YWRtaW4= \
    STAGING_ENVIRONMENT_IP=192.168.1.3:9165 \
    STAGING_ENVIRONMENT_BASIC_AUTH_TOKEN=YWRtaW46YWRtaW4= \
    PRODUCTION_ENVIRONMENT_IP=192.168.1.3:9166 \
    PRODUCTION_ENVIRONMENT_BASIC_AUTH_TOKEN=YWRtaW46YWRtaW4= \
    EMAIL_NOTIFICATION_RECEIVERS=sajithaliyanage@gmail.com 
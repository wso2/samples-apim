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

FROM sonatype/nexus3:3.19.1
USER 0
RUN echo "reference\:file\:nexus-casc-plugin-3.19.1-01.jar = 199" >> /opt/sonatype/nexus/etc/karaf/startup.properties
COPY --chown=root:root nexus-casc-plugin-3.19.1-01.jar /opt/sonatype/nexus/system/nexus-casc-plugin-3.19.1-01.jar
COPY ./nexus_casc.yml /opt/nexus.yml
ENV NEXUS_CASC_CONFIG=/opt/nexus.yml \
    NEXUS_ADMIN_ID=adminuser \
    NEXUS_ADMIN_PASSWORD=admin123 \
    NEXUS_ADMIN_EMAIL=admin@exmaple.org 
USER nexus

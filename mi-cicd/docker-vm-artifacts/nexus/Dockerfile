FROM sonatype/nexus3:3.19.1
USER 0
RUN curl -O https://github.com/sventschui/nexus-casc-plugin/releases/download/3.19.1-01/nexus-casc-plugin-3.19.1-01.jar
RUN echo "reference\:file\:nexus-casc-plugin-3.19.1-01.jar = 199" >> /opt/sonatype/nexus/etc/karaf/startup.properties
COPY --chown=root:root ../../lib/nexus-casc-plugin-3.19.1-01.jar /opt/sonatype/nexus/system/nexus-casc-plugin-3.19.1-01.jar
COPY ../../scripts/nexus/nexus_casc.yml /opt/nexus.yml
ENV NEXUS_CASC_CONFIG=/opt/nexus.yml \
    NEXUS_ADMIN_ID=adminuser \
    NEXUS_ADMIN_PASSWORD=admin123 \
    NEXUS_ADMIN_EMAIL=admin@exmaple.org 
USER nexus
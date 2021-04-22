
FROM adoptopenjdk/openjdk11:jdk-11.0.9_11-alpine
RUN apk add --no-cache bash
# copy init script to user home
COPY train-schedule-1.0.0.jar /root/
COPY docker-entrypoint.sh /root/

# expose ports
EXPOSE 8080

ENTRYPOINT ["/root/docker-entrypoint.sh"]
RUN ["chmod", "+x", "/root/docker-entrypoint.sh"]
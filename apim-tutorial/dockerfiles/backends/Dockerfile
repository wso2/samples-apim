FROM tomcat:9-jre8-alpine

ARG SERVICE=*
ADD ${SERVICE}.war /usr/local/tomcat/webapps/

EXPOSE 8080

CMD ["catalina.sh", "run"]

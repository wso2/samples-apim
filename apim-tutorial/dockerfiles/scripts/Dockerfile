FROM alpine:3.7
# install curl
RUN apk --no-cache add curl jq

COPY setup.sh /
COPY tenant-creation.sh /
RUN ["mkdir", "/quantis-resources"]
COPY quantis-resources/ /quantis-resources/

RUN ["mkdir", "/gogo-resources"]
COPY gogo-resources/ /gogo-resources/

RUN ["mkdir", "/railco-resources"]
COPY railco-resources/ /railco-resources/

#CMD ["sh" ,"setup.sh"]
RUN ["chmod", "+x", "/setup.sh"]
RUN ["chmod", "+x", "/tenant-creation.sh"]
RUN ["chmod", "+x", "/quantis-resources/deploy-api.sh"]
RUN ["chmod", "+x", "/gogo-resources/deploy-api.sh"]
RUN ["chmod", "+x", "/railco-resources/deploy-api.sh"]
CMD ["sh", "/setup.sh"]
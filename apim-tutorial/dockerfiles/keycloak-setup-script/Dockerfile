FROM alpine:3.7
# install curl
RUN apk --no-cache add curl jq

COPY setup.sh /
COPY setup-keycloak.sh /

RUN ["chmod", "+x", "/setup.sh"]
RUN ["chmod", "+x", "/setup-keycloak.sh"]

ENTRYPOINT ["sh", "/setup.sh"]

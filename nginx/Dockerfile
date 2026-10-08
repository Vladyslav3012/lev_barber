FROM nginx:1.27-alpine

RUN apk add --no-cache gettext

COPY templates/ /etc/nginx/templates/
COPY snippets/ /etc/nginx/snippets/
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]

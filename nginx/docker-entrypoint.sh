#!/bin/sh
set -e

: "${DOMAIN:?DOMAIN is required}"

export DOMAIN

CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"

rm -f /etc/nginx/conf.d/*.conf
cp /etc/nginx/snippets/http-hardening.conf /etc/nginx/conf.d/00-hardening.conf

if [ -f "$CERT_PATH" ]; then
  envsubst '${DOMAIN}' < /etc/nginx/templates/http-redirect.conf.template \
    > /etc/nginx/conf.d/http.conf
  envsubst '${DOMAIN}' < /etc/nginx/templates/ssl.conf.template \
    > /etc/nginx/conf.d/ssl.conf
else
  envsubst '${DOMAIN}' < /etc/nginx/templates/http-proxy.conf.template \
    > /etc/nginx/conf.d/http.conf
fi

mkdir -p /var/run/nginx-reload

(
  while true; do
    if [ -f /var/run/nginx-reload/reload ]; then
      nginx -s reload
      rm -f /var/run/nginx-reload/reload
    fi
    sleep 30
  done
) &

exec nginx -g 'daemon off;'

#!/bin/sh

set -eu

echo "window.API_URL = \"${API_URL}\";" > /usr/share/nginx/html/config.js
exec nginx -g 'daemon off;'

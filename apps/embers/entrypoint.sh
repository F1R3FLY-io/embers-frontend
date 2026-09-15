#!/bin/sh
set -eu
jq -nr --arg api "${API_URL}" --arg sky "${FIRESKY_URL:-}" --arg pds "${FIRESKY_PDS_URL:-}" --arg demo "${FIRESKY_DEMO_PDS_URL:-}" '
  "window.API_URL = " + ($api | tojson) + ";\n" +
  "window.FIRESKY_URL = " + ($sky | tojson) + ";\n" +
  "window.FIRESKY_PDS_URL = " + ($pds | tojson) + ";\n" +
  "window.FIRESKY_DEMO_PDS_URL = " + ($demo | tojson) + ";"
' > /usr/share/nginx/html/config.js
exec nginx -g 'daemon off;'

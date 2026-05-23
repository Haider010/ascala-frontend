#!/bin/sh
set -eu

cat > /usr/share/nginx/html/runtime-env.js <<EOF
window.__ASCALA_CONFIG__ = {
  apiBaseUrl: "${VITE_API_BASE_URL:-}"
};
EOF

# Build stage
FROM node:20-alpine AS builder

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY runtime-env.template.js /etc/nginx/templates/runtime-env.js.template

# Expose port 3000
EXPOSE 3000

# Start nginx after writing runtime frontend config from Railway env vars.
CMD ["/bin/sh", "-c", "printf 'window.__ASCALA_CONFIG__ = {\\n  apiBaseUrl: \"%s\"\\n};\\n' \"$VITE_API_BASE_URL\" > /usr/share/nginx/html/runtime-env.js && nginx -g 'daemon off;'"]

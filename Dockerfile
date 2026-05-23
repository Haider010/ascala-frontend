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
COPY docker-entrypoint.d/99-runtime-env.sh /docker-entrypoint.d/99-runtime-env.sh
RUN chmod +x /docker-entrypoint.d/99-runtime-env.sh

# Expose port 3000
EXPOSE 3000

# Start nginx. The official nginx entrypoint processes templates and runs scripts in /docker-entrypoint.d.
CMD ["nginx", "-g", "daemon off;"]

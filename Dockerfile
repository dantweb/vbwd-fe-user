# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Requires vbwd-fe-core submodule (clone with --recurse-submodules)
COPY . .

# Build shared component library first so the file: dependency resolves
RUN cd vbwd-fe-core && npm install && npm run build && rm -rf node_modules

# Install and build main application
RUN npm install

ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.prod.conf.template /etc/nginx/templates/default.conf.template

# API_UPSTREAM is the backend service host:port within the Docker network.
# Override at runtime via environment variable, e.g. API_UPSTREAM=api:5000
ENV API_UPSTREAM=api:5000

EXPOSE 80

# syntax=docker/dockerfile:1

# Unified Dockerfile for all apps (api, web)
# Usage: docker build --target runner-<app> .
# Available targets: runner-api, runner-web

# ==============================================================================
# BASE STAGE - Common setup for all apps
# ==============================================================================
FROM node:22-alpine AS base
WORKDIR /app

# Install build tools for native deps
RUN apk add --no-cache python3 make g++ build-base

# Copy package files for dependency installation
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/utils/package.json packages/utils/package.json

# Install all dependencies using npm
RUN npm ci --no-audit --no-fund

# Copy all source code
COPY . .

# ==============================================================================
# API BUILD STAGE
# ==============================================================================
FROM base AS builder-api
ENV NODE_ENV=production
RUN npx turbo run build --filter=api...

# ==============================================================================
# WEB BUILD STAGE
# ==============================================================================
FROM base AS builder-web
ENV NODE_ENV=production
RUN npx turbo run build --filter=web...

# ==============================================================================
# API RUNNER STAGE
# ==============================================================================
FROM node:22-alpine AS runner-api
WORKDIR /app
ENV NODE_ENV=production

# Install wget for healthcheck and bash for terminal access
RUN apk add --no-cache wget bash

# Copy runtime deps and built artifacts
COPY --from=builder-api /app/node_modules ./node_modules
COPY --from=builder-api /app/apps/api/dist ./apps/api/dist
COPY --from=builder-api /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder-api /app/packages ./packages
COPY --from=builder-api /app/package.json ./package.json

EXPOSE 8000
USER node
CMD ["node", "apps/api/dist/main.js"]

# ==============================================================================
# WEB RUNNER STAGE
# ==============================================================================
FROM nginx:alpine AS runner-web
WORKDIR /usr/share/nginx/html

# Clean default nginx html files
RUN rm -rf ./*

# Copy built artifacts from the web app
COPY --from=builder-web /app/apps/web/dist ./

# We expose 80 to match standard web server
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
FROM node:20-alpine AS base

# Install pnpm and netcat for healthchecks
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    apk add --no-cache netcat-openbsd

# Build stage
FROM base AS builder
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/

# Install ALL dependencies (including dev deps for drizzle-kit)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/api ./packages/api
COPY packages/shared ./packages/shared

# Build packages
RUN pnpm --filter @rewind/shared build
RUN pnpm --filter @rewind/api build

# Production stage
FROM base AS runner
WORKDIR /app

# Copy workspace metadata and dependencies
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/api ./packages/api
COPY --from=builder /app/packages/shared ./packages/shared

# Copy entrypoint script
COPY packages/api/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Use entrypoint for migrations
ENTRYPOINT ["docker-entrypoint.sh"]

# Theia Mobile Backend Dockerfile
FROM node:20-slim AS builder

WORKDIR /app

# Install system dependencies for node-gyp
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy root package files
COPY package*.json ./
COPY lerna.json ./
COPY tsconfig.json ./

# Copy core-mobile package
COPY packages/core-mobile ./packages/core-mobile

# Copy necessary Theia core packages (minimal dependencies)
COPY packages/core ./packages/core

# Install dependencies
RUN npm install --production=false

# Build core-mobile package
WORKDIR /app/packages/core-mobile
RUN npm run compile

# Production stage
FROM node:20-slim

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy built artifacts
COPY --from=builder /app/packages/core-mobile/lib ./packages/core-mobile/lib
COPY --from=builder /app/packages/core-mobile/package*.json ./packages/core-mobile/
COPY --from=builder /app/packages/core/lib ./packages/core/lib
COPY --from=builder /app/node_modules ./node_modules

# Set working directory
WORKDIR /app/packages/core-mobile

# Expose port
EXPOSE 3030

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3030/health || exit 1

# Environment variables
ENV NODE_ENV=production \
    MOBILE_BACKEND_PORT=3030 \
    MOBILE_BACKEND_HOST=0.0.0.0 \
    LOG_LEVEL=info

# Start backend
CMD ["node", "lib/node/backend-main.js"]
